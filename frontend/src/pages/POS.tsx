import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Split,
  Percent,
  X,
  Barcode,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  setCustomer,
  setCartDiscount,
  setPaymentMethod,
  clearCart,
} from '../store/slices/cartSlice';
import { openModal } from '../store/slices/uiSlice';
import { searchApi, documentApi } from '../services/api';
import type { Product, Customer, DocumentItem } from '../types';
import { theme } from '../styles/GlobalStyles';
import toast from 'react-hot-toast';
import { updateShiftStats } from '../store/slices/shiftSlice';
import { addDocument } from '../store/slices/dataSlice';

// ============================================
// Styled Components
// ============================================

const POSContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  height: calc(100vh - 108px);
`;

const ProductsSection = styled.div`
  display: flex;
  flex-direction: column;
  background: ${theme.colors.white};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: ${theme.shadows.sm};
`;

const SearchBar = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  gap: 12px;
`;

const SearchInput = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${theme.colors.gray100};
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease;

  &:focus-within {
    background: white;
    border-color: ${theme.colors.primary};
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 15px;
    color: ${theme.colors.textPrimary};

    &::placeholder {
      color: ${theme.colors.textMuted};
    }
  }

  svg {
    color: ${theme.colors.textMuted};
  }
`;

const BarcodeButton = styled.button`
  padding: 12px;
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primary};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.primary};
    color: white;
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid ${theme.colors.border};
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 4px;
  }
`;

const CategoryTab = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
  background: ${props => props.active ? theme.colors.primary : theme.colors.gray100};
  color: ${props => props.active ? 'white' : theme.colors.textSecondary};

  &:hover {
    background: ${props => props.active ? theme.colors.primaryHover : theme.colors.gray200};
  }
`;

const ProductsGrid = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  align-content: start;
`;

const ProductCard = styled.button`
  padding: 16px 12px;
  background: ${theme.colors.gray50};
  border-radius: 10px;
  text-align: center;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    background: ${theme.colors.primaryLight};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ProductName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.textPrimary};
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProductPrice = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${theme.colors.primary};
`;

const ProductStock = styled.span<{ low?: boolean }>`
  font-size: 11px;
  color: ${props => props.low ? theme.colors.warning : theme.colors.textMuted};
`;

// Cart Section
const CartSection = styled.div`
  display: flex;
  flex-direction: column;
  background: ${theme.colors.white};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: ${theme.shadows.sm};
`;

const CartHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const ClearCartButton = styled.button`
  padding: 6px 12px;
  font-size: 12px;
  color: ${theme.colors.danger};
  border-radius: 4px;

  &:hover {
    background: ${theme.colors.dangerLight};
  }
`;

const CustomerSelect = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${theme.colors.gray50};
  margin: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    background: ${theme.colors.gray100};
  }

  svg {
    color: ${theme.colors.textMuted};
  }
`;

const CustomerName = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
`;

const CustomerDiscount = styled.span`
  font-size: 12px;
  color: ${theme.colors.success};
  background: ${theme.colors.successLight};
  padding: 2px 8px;
  border-radius: 10px;
`;

const CartItems = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
`;

const CartItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const CartItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CartItemName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CartItemPrice = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin-top: 2px;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuantityButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${theme.colors.gray100};
  color: ${theme.colors.textSecondary};
  transition: all 0.2s ease;

  &:hover {
    background: ${theme.colors.gray200};
    color: ${theme.colors.textPrimary};
  }
`;

const QuantityValue = styled.span`
  width: 30px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
`;

const CartItemTotal = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  text-align: right;
  min-width: 70px;
`;

const RemoveButton = styled.button`
  padding: 4px;
  color: ${theme.colors.textMuted};
  border-radius: 4px;

  &:hover {
    color: ${theme.colors.danger};
    background: ${theme.colors.dangerLight};
  }
`;

// Cart Footer
const CartFooter = styled.div`
  padding: 16px;
  border-top: 1px solid ${theme.colors.border};
`;

const CartSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const SummaryRow = styled.div<{ highlight?: boolean }>`
  display: flex;
  justify-content: space-between;
  font-size: ${props => props.highlight ? '18px' : '14px'};
  font-weight: ${props => props.highlight ? '700' : '400'};
  color: ${props => props.highlight ? theme.colors.textPrimary : theme.colors.textSecondary};
`;

const DiscountButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${theme.colors.primary};
  font-size: 13px;

  &:hover {
    text-decoration: underline;
  }
`;

const PaymentButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
`;

const PaymentButton = styled.button<{ active?: boolean; color?: string }>`
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  background: ${props => props.active ? (props.color || theme.colors.primary) : theme.colors.gray100};
  color: ${props => props.active ? 'white' : theme.colors.textSecondary};

  &:hover {
    background: ${props => props.active ? (props.color || theme.colors.primary) : theme.colors.gray200};
  }
`;

const CompleteButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 16px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  background: ${props => props.disabled ? theme.colors.gray200 : 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)'};
  color: ${props => props.disabled ? theme.colors.textMuted : 'white'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  }
`;

const EmptyCart = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: ${theme.colors.textMuted};
  padding: 40px;
  text-align: center;
`;

// ============================================
// Component
// ============================================

export default function POS() {
  const dispatch = useAppDispatch();
  const { products, categories, selectedStore } = useAppSelector(state => state.data);
  const { items, customer, subtotal, discount, total, paymentMethod } = useAppSelector(state => state.cart);
  const { currentShift } = useAppSelector(state => state.shift);
  const { user } = useAppSelector(state => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search and category
  useEffect(() => {
    let result = products.filter(p => !p.deleted);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.barcode?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      result = result.filter(p => p.categories.includes(selectedCategory));
    }

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory]);

  // Handle barcode scan (auto-add to cart)
  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    if (!user) return;
    
    try {
      const response = await searchApi.searchByBarcode(user._client, barcode);
      if (response.data.length > 0) {
        dispatch(addToCart({ product: response.data[0] }));
        toast.success('Товар додано');
        setSearchQuery('');
      } else {
        toast.error('Товар не знайдено');
      }
    } catch {
      toast.error('Помилка пошуку');
    }
  }, [user, dispatch]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on Ctrl/Cmd + F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Complete sale on F2
      if (e.key === 'F2' && items.length > 0 && paymentMethod) {
        handleCompleteSale();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, paymentMethod]);

  const handleAddProduct = (product: Product) => {
    dispatch(addToCart({ product }));
  };

  const handleSelectCustomer = () => {
    dispatch(openModal({ modal: 'customer-select' }));
  };

  const handleDiscountClick = () => {
    dispatch(openModal({ modal: 'discount' }));
  };

  const handleCompleteSale = async () => {
    if (!user || items.length === 0 || !paymentMethod) return;
    
    if (!currentShift) {
      toast.error('Відкрийте зміну для здійснення продажу');
      return;
    }

    try {
      // Create document items
      const docItems: DocumentItem[] = items.map(item => ({
        product_id: item.product._id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        cost: item.product.cost,
        discount: item.discount,
        total: item.total,
      }));

      // Create sale document
      const response = await documentApi.createDocument(user._client, {
        type: 'sale',
        store_id: selectedStore?._id,
        customer_id: customer?._id,
        shift_id: currentShift._id,
        items: docItems,
        total,
        subtotal,
        discount,
        paid: total,
        debt: 0,
        payment_method: paymentMethod,
      });

      if (response.status) {
        // Update shift stats
        dispatch(updateShiftStats({ salesCount: 1, salesTotal: total }));
        // Add document to store
        dispatch(addDocument(response.data));
        // Clear cart
        dispatch(clearCart());
        toast.success(`Чек #${response.data.number} створено`);
      }
    } catch {
      toast.error('Помилка створення чеку');
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2) + ' ₴';
  };

  return (
    <MainLayout title="Каса">
      <POSContainer>
        {/* Products Section */}
        <ProductsSection>
          <SearchBar>
            <SearchInput>
              <Search size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Пошук товару (назва, артикул, штрихкод)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.length > 5) {
                    handleBarcodeSearch(searchQuery);
                  }
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X size={18} />
                </button>
              )}
            </SearchInput>
            <BarcodeButton onClick={() => searchInputRef.current?.focus()}>
              <Barcode size={20} />
            </BarcodeButton>
          </SearchBar>

          <CategoryTabs>
            <CategoryTab
              active={!selectedCategory}
              onClick={() => setSelectedCategory(null)}
            >
              Всі товари
            </CategoryTab>
            {categories.slice(0, 10).map(category => (
              <CategoryTab
                key={category}
                active={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </CategoryTab>
            ))}
          </CategoryTabs>

          <ProductsGrid>
            {filteredProducts.map(product => (
              <ProductCard
                key={product._id}
                onClick={() => handleAddProduct(product)}
              >
                <ProductName>{product.name}</ProductName>
                <ProductPrice>{formatPrice(product.price)}</ProductPrice>
                <ProductStock low={product.total_stock < 5}>
                  В наявності: {product.total_stock}
                </ProductStock>
              </ProductCard>
            ))}
          </ProductsGrid>
        </ProductsSection>

        {/* Cart Section */}
        <CartSection>
          <CartHeader>
            <CartTitle>Кошик ({items.length})</CartTitle>
            {items.length > 0 && (
              <ClearCartButton onClick={() => dispatch(clearCart())}>
                Очистити
              </ClearCartButton>
            )}
          </CartHeader>

          <CustomerSelect onClick={handleSelectCustomer}>
            <User size={18} />
            <CustomerName>
              {customer ? customer.name : 'Обрати клієнта'}
            </CustomerName>
            {customer?.discount ? (
              <CustomerDiscount>-{customer.discount}%</CustomerDiscount>
            ) : null}
          </CustomerSelect>

          {items.length > 0 ? (
            <>
              <CartItems>
                {items.map(item => (
                  <CartItem key={item.product._id}>
                    <CartItemInfo>
                      <CartItemName>{item.product.name}</CartItemName>
                      <CartItemPrice>{formatPrice(item.price)}</CartItemPrice>
                    </CartItemInfo>
                    <QuantityControls>
                      <QuantityButton
                        onClick={() =>
                          dispatch(updateQuantity({ productId: item.product._id, quantity: item.quantity - 1 }))
                        }
                      >
                        <Minus size={14} />
                      </QuantityButton>
                      <QuantityValue>{item.quantity}</QuantityValue>
                      <QuantityButton
                        onClick={() =>
                          dispatch(updateQuantity({ productId: item.product._id, quantity: item.quantity + 1 }))
                        }
                      >
                        <Plus size={14} />
                      </QuantityButton>
                    </QuantityControls>
                    <CartItemTotal>{formatPrice(item.total)}</CartItemTotal>
                    <RemoveButton
                      onClick={() => dispatch(removeFromCart(item.product._id))}
                    >
                      <Trash2 size={16} />
                    </RemoveButton>
                  </CartItem>
                ))}
              </CartItems>

              <CartFooter>
                <CartSummary>
                  <SummaryRow>
                    <span>Підсумок</span>
                    <span>{formatPrice(subtotal)}</span>
                  </SummaryRow>
                  <SummaryRow>
                    <DiscountButton onClick={handleDiscountClick}>
                      <Percent size={14} />
                      Знижка
                    </DiscountButton>
                    <span>-{formatPrice(discount)}</span>
                  </SummaryRow>
                  <SummaryRow highlight>
                    <span>До сплати</span>
                    <span>{formatPrice(total)}</span>
                  </SummaryRow>
                </CartSummary>

                <PaymentButtons>
                  <PaymentButton
                    active={paymentMethod === 'cash'}
                    color="#27ae60"
                    onClick={() => dispatch(setPaymentMethod('cash'))}
                  >
                    <Banknote size={20} />
                    Готівка
                  </PaymentButton>
                  <PaymentButton
                    active={paymentMethod === 'card'}
                    color="#3498db"
                    onClick={() => dispatch(setPaymentMethod('card'))}
                  >
                    <CreditCard size={20} />
                    Картка
                  </PaymentButton>
                  <PaymentButton
                    active={paymentMethod === 'split'}
                    color="#9b59b6"
                    onClick={() => dispatch(setPaymentMethod('split'))}
                  >
                    <Split size={20} />
                    Сплит
                  </PaymentButton>
                </PaymentButtons>

                <CompleteButton
                  disabled={!paymentMethod || !currentShift}
                  onClick={handleCompleteSale}
                >
                  {!currentShift ? 'Відкрийте зміну' : 'Оформити продаж (F2)'}
                </CompleteButton>
              </CartFooter>
            </>
          ) : (
            <EmptyCart>
              <ShoppingCart size={48} />
              <span>Кошик порожній</span>
              <span style={{ fontSize: '12px' }}>
                Оберіть товари зі списку
              </span>
            </EmptyCart>
          )}
        </CartSection>
      </POSContainer>
    </MainLayout>
  );
}

// Re-export ShoppingCart for empty state
import { ShoppingCart } from 'lucide-react';
