import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  Package,
  MoreVertical,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchProducts, fetchCategories } from '../store/slices/dataSlice';
import { dataApi } from '../services/api';
import type { Product } from '../types';
import { theme } from '../styles/GlobalStyles';

// ============================================
// Styled Components
// ============================================

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button<{ primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  background: ${props => props.primary ? theme.colors.primary : theme.colors.white};
  color: ${props => props.primary ? 'white' : theme.colors.textPrimary};
  border: ${props => props.primary ? 'none' : `1px solid ${theme.colors.border}`};

  &:hover {
    background: ${props => props.primary ? theme.colors.primaryHover : theme.colors.gray100};
  }
`;

const FiltersBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
`;

const SearchInputWrapper = styled.div`
  flex: 1;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;

  &:focus-within {
    border-color: ${theme.colors.primary};
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;

    &::placeholder {
      color: ${theme.colors.textMuted};
    }
  }

  svg {
    color: ${theme.colors.textMuted};
  }
`;

const FilterSelect = styled.select`
  padding: 10px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  background: ${theme.colors.white};
  color: ${theme.colors.textPrimary};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: ${theme.colors.white};
  border-radius: 12px;
  padding: 20px;
  border: 1px solid ${theme.colors.border};
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const TableContainer = styled.div`
  background: ${theme.colors.white};
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 14px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${theme.colors.textSecondary};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.border};
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  border-bottom: 1px solid ${theme.colors.border};
`;

const ProductRow = styled.tr`
  cursor: pointer;
  transition: background 0.1s ease;

  &:hover {
    background: ${theme.colors.gray50};
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const ProductNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProductIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${theme.colors.primaryLight};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.primary};
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductName = styled.span`
  font-weight: 500;
`;

const ProductSKU = styled.span`
  font-size: 12px;
  color: ${theme.colors.textMuted};
`;

const CategoryBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  background: ${theme.colors.gray100};
  border-radius: 12px;
  font-size: 12px;
  color: ${theme.colors.textSecondary};
  margin-right: 4px;
`;

const PriceCell = styled.div`
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const StockCell = styled.div<{ low?: boolean; zero?: boolean }>`
  font-weight: 500;
  color: ${props => {
    if (props.zero) return theme.colors.danger;
    if (props.low) return theme.colors.warning;
    return theme.colors.success;
  }};
`;

const ActionMenu = styled.button`
  padding: 8px;
  border-radius: 6px;
  color: ${theme.colors.textMuted};

  &:hover {
    background: ${theme.colors.gray100};
    color: ${theme.colors.textPrimary};
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid ${theme.colors.border};
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
`;

const PageButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PageButton = styled.button<{ active?: boolean }>`
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 14px;
  background: ${props => props.active ? theme.colors.primary : theme.colors.white};
  color: ${props => props.active ? 'white' : theme.colors.textPrimary};
  border: 1px solid ${props => props.active ? theme.colors.primary : theme.colors.border};

  &:hover:not(:disabled) {
    background: ${props => props.active ? theme.colors.primaryHover : theme.colors.gray100};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: ${theme.colors.textMuted};

  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: ${theme.colors.textPrimary};
    margin: 0 0 8px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

const FilterBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const FilterBannerText = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #856404;
  font-weight: 500;

  svg {
    color: #ffc107;
  }
`;

const ClearFilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #ffc107;
  border-radius: 6px;
  font-size: 13px;
  color: #856404;
  cursor: pointer;
  
  &:hover {
    background: #fff8e1;
  }
`;

// ============================================
// Component
// ============================================

type FilterType = 'zero_cost' | 'negative_stock' | 'expired' | null;

const filterLabels: Record<string, string> = {
  zero_cost: 'Товари з собівартістю 0 грн',
  negative_stock: 'Товари з від\'ємним залишком',
  expired: 'Товари з истёкшим сроком годності',
};

export default function Products() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { products, productsTotal, categories } = useAppSelector(state => state.data);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [specialFilterProducts, setSpecialFilterProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const itemsPerPage = 20;
  
  // Get filter from URL params
  const activeFilter = searchParams.get('filter') as FilterType;

  // Load filtered products from API when filter is active
  useEffect(() => {
    const loadFilteredProducts = async () => {
      if (activeFilter && user) {
        setLoading(true);
        try {
          const response = await dataApi.getFilteredProducts(user._client, activeFilter);
          if (response.status && response.data) {
            setSpecialFilterProducts(response.data);
          }
        } catch (error) {
          console.error('Failed to load filtered products:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setSpecialFilterProducts([]);
      }
    };
    
    loadFilteredProducts();
  }, [activeFilter, user]);

  // Refresh data on mount
  useEffect(() => {
    if (user && !activeFilter) {
      dispatch(fetchProducts({ companyId: user._client }));
      dispatch(fetchCategories(user._client));
    }
  }, [dispatch, user, activeFilter]);

  // Filter products
  useEffect(() => {
    // If we have a special filter active, use those products
    if (activeFilter && specialFilterProducts.length > 0) {
      let result = specialFilterProducts;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query) ||
            p.barcode?.toLowerCase().includes(query)
        );
      }
      
      setFilteredProducts(result);
      setCurrentPage(1);
      return;
    }
    
    // Normal filtering
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
    setCurrentPage(1);
  }, [products, searchQuery, selectedCategory, activeFilter, specialFilterProducts]);
  
  const clearFilter = () => {
    navigate('/pos/products');
  };

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const formatPrice = (price: number) => {
    return price.toFixed(2) + ' ₴';
  };

  // Calculate stats
  const totalStock = products.reduce((sum, p) => sum + (p.total_stock || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + (p.total_stock * p.cost), 0);
  const lowStockCount = products.filter(p => p.total_stock > 0 && p.total_stock < 5).length;
  const outOfStockCount = products.filter(p => p.total_stock <= 0).length;

  const pageTitle = activeFilter ? filterLabels[activeFilter] || 'Товари' : 'Товари';

  return (
    <MainLayout title={pageTitle}>
      <PageHeader>
        <PageTitle>{activeFilter ? filterLabels[activeFilter] : 'Каталог товарів'}</PageTitle>
        <HeaderActions>
          <ActionButton>
            <Upload size={18} />
            Імпорт
          </ActionButton>
          <ActionButton>
            <Download size={18} />
            Експорт
          </ActionButton>
          <ActionButton primary>
            <Plus size={18} />
            Додати товар
          </ActionButton>
        </HeaderActions>
      </PageHeader>

      {activeFilter && (
        <FilterBanner>
          <FilterBannerText>
            <AlertTriangle size={18} />
            Показано {filteredProducts.length} товарів: {filterLabels[activeFilter]}
          </FilterBannerText>
          <ClearFilterButton onClick={clearFilter}>
            <X size={14} />
            Скинути фільтр
          </ClearFilterButton>
        </FilterBanner>
      )}

      {!activeFilter && <StatsBar>
        <StatCard>
          <StatValue>{productsTotal}</StatValue>
          <StatLabel>Всього товарів</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalStock.toFixed(0)}</StatValue>
          <StatLabel>Загальний залишок</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatPrice(totalValue)}</StatValue>
          <StatLabel>Вартість залишків</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue style={{ color: lowStockCount > 0 ? theme.colors.warning : theme.colors.success }}>
            {lowStockCount + outOfStockCount}
          </StatValue>
          <StatLabel>Потребує уваги</StatLabel>
        </StatCard>
      </StatsBar>}

      <FiltersBar>
        <SearchInputWrapper>
          <Search size={18} />
          <input
            type="text"
            placeholder="Пошук за назвою, артикулом, штрихкодом..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchInputWrapper>
        <FilterSelect
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Всі категорії</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </FilterSelect>
        <ActionButton>
          <Filter size={18} />
          Фільтри
        </ActionButton>
      </FiltersBar>

      <TableContainer>
        {paginatedProducts.length > 0 ? (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Товар</Th>
                  <Th>Категорія</Th>
                  <Th style={{ textAlign: 'right' }}>Ціна</Th>
                  <Th style={{ textAlign: 'right' }}>Собівартість</Th>
                  <Th style={{ textAlign: 'right' }}>Залишок</Th>
                  <Th style={{ width: '50px' }}></Th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map(product => (
                  <ProductRow key={product._id}>
                    <Td>
                      <ProductNameCell>
                        <ProductIcon>
                          <Package size={20} />
                        </ProductIcon>
                        <ProductInfo>
                          <ProductName>{product.name}</ProductName>
                          {product.sku && <ProductSKU>SKU: {product.sku}</ProductSKU>}
                        </ProductInfo>
                      </ProductNameCell>
                    </Td>
                    <Td>
                      {product.categories.slice(0, 2).map(cat => (
                        <CategoryBadge key={cat}>{cat}</CategoryBadge>
                      ))}
                      {product.categories.length > 2 && (
                        <CategoryBadge>+{product.categories.length - 2}</CategoryBadge>
                      )}
                    </Td>
                    <Td style={{ textAlign: 'right' }}>
                      <PriceCell>{formatPrice(product.price)}</PriceCell>
                    </Td>
                    <Td style={{ textAlign: 'right' }}>
                      {formatPrice(product.cost)}
                    </Td>
                    <Td style={{ textAlign: 'right' }}>
                      <StockCell
                        zero={product.total_stock <= 0}
                        low={product.total_stock > 0 && product.total_stock < 5}
                      >
                        {product.total_stock}
                      </StockCell>
                    </Td>
                    <Td>
                      <ActionMenu>
                        <MoreVertical size={18} />
                      </ActionMenu>
                    </Td>
                  </ProductRow>
                ))}
              </tbody>
            </Table>
            <Pagination>
              <PageInfo>
                Показано {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} з {filteredProducts.length}
              </PageInfo>
              <PageButtons>
                <PageButton
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ←
                </PageButton>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <PageButton
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </PageButton>
                  );
                })}
                <PageButton
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  →
                </PageButton>
              </PageButtons>
            </Pagination>
          </>
        ) : (
          <EmptyState>
            <Package size={64} />
            <h3>Товарів не знайдено</h3>
            <p>Спробуйте змінити фільтри або додайте новий товар</p>
          </EmptyState>
        )}
      </TableContainer>
    </MainLayout>
  );
}
