import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Package,
  MoreVertical,
  X,
  AlertTriangle,
  ChevronRight,
  Home,
  Settings,
  ChevronDown,
  Image as ImageIcon,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchProducts, fetchCategories } from '../store/slices/dataSlice';
import { dataApi } from '../services/api';
import type { Product, Store } from '../types';
import { theme } from '../styles/GlobalStyles';

// ============================================
// Styled Components
// ============================================

const PageContainer = styled.div`
  padding: 0;
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: ${theme.colors.textSecondary};

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
      text-decoration: underline;
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
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
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  background: ${props => props.primary ? '#4caf50' : theme.colors.white};
  color: ${props => props.primary ? 'white' : theme.colors.textPrimary};
  border: ${props => props.primary ? 'none' : `1px solid ${theme.colors.border}`};
  cursor: pointer;

  &:hover {
    background: ${props => props.primary ? '#45a049' : theme.colors.gray100};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const FiltersBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
`;

const SearchInputWrapper = styled.div`
  flex: 1;
  max-width: 300px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: ${theme.colors.white};
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;

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
    width: 18px;
    height: 18px;
  }
`;

const FilterButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid ${props => props.active ? theme.colors.primary : theme.colors.border};
  background: ${props => props.active ? theme.colors.primaryLight : theme.colors.white};
  color: ${props => props.active ? theme.colors.primary : theme.colors.textPrimary};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${theme.colors.gray50};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ActionDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.white};
  color: ${theme.colors.textPrimary};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: ${theme.colors.gray50};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 250px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  box-shadow: ${theme.shadows.lg};
  z-index: 1000;
  display: ${props => props.isOpen ? 'block' : 'none'};
  overflow: hidden;
`;

const DropdownSection = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const DropdownSectionTitle = styled.div`
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
`;

const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  cursor: pointer;

  &:hover {
    background: ${theme.colors.gray50};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const DropdownItemDanger = styled(DropdownItem)`
  color: ${theme.colors.danger};
`;

const FilterPanel = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'block' : 'none'};
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const FilterPanelTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  background: ${theme.colors.white};
  color: ${theme.colors.textPrimary};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FilterCheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid ${theme.colors.border};
`;

const TableContainer = styled.div`
  background: ${theme.colors.white};
  border-radius: 8px;
  border: 1px solid ${theme.colors.border};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${theme.colors.textSecondary};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.border};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 12px 16px;
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

const ProductImage = styled.div`
  width: 40px;
  height: 40px;
  background: ${theme.colors.gray100};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textMuted};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductName = styled.span`
  font-weight: 500;
  color: ${theme.colors.primary};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid ${theme.colors.border};
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
`;

const PageButtons = styled.div`
  display: flex;
  gap: 4px;
`;

const PageButton = styled.button<{ active?: boolean }>`
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 14px;
  background: ${props => props.active ? theme.colors.primary : theme.colors.white};
  color: ${props => props.active ? 'white' : theme.colors.textPrimary};
  border: 1px solid ${props => props.active ? theme.colors.primary : theme.colors.border};
  cursor: pointer;

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

const SlidePanel = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-600px'};
  width: 600px;
  height: 100vh;
  background: white;
  box-shadow: ${theme.shadows.xl};
  z-index: 1000;
  transition: right 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const SlidePanelOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const SlidePanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const SlidePanelTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: none;
  border: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${theme.colors.gray100};
    color: ${theme.colors.textPrimary};
  }
`;

const SlidePanelTabs = styled.div`
  display: flex;
  gap: 0;
  padding: 0 24px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 14px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? theme.colors.primary : 'transparent'};
  color: ${props => props.active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const SlidePanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  margin-bottom: 6px;

  span {
    color: ${theme.colors.danger};
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    background: ${theme.colors.gray50};
    cursor: not-allowed;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const SlidePanelFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid ${theme.colors.border};
`;

const SettingsButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: white;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${theme.colors.gray50};
    color: ${theme.colors.textPrimary};
  }
`;

// ============================================
// Component
// ============================================

type FilterType = 'zero_cost' | 'negative_stock' | 'expired' | null;
type ProductType = 'product' | 'service' | 'kit';

export default function Products() {
  const dispatch = useAppDispatch();
  const { user, companyId } = useAppSelector(state => state.auth);
  const { products, productsTotal, categories } = useAppSelector(state => state.data);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [createProductType, setCreateProductType] = useState<ProductType>('product');
  
  // Filter states
  const [filterPreset, setFilterPreset] = useState('');
  const [filterPriceFrom, setFilterPriceFrom] = useState('');
  const [filterPriceTo, setFilterPriceTo] = useState('');
  const [filterStockFrom, setFilterStockFrom] = useState('');
  const [filterStockTo, setFilterStockTo] = useState('');
  
  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    photo: true,
    code: true,
    sku: true,
    unit: true,
    price: true,
    discount: true,
  });
  
  const itemsPerPage = 20;
  
  // Get filter from URL params
  const activeFilter = searchParams.get('filter') as FilterType;

  // Load products and stores
  useEffect(() => {
    const loadData = async () => {
      if (companyId) {
        setLoading(true);
        try {
          dispatch(fetchProducts({ companyId }));
          dispatch(fetchCategories(companyId));
          
          // Load stores
          const storesResponse = await dataApi.getStores(companyId);
          if (storesResponse.status && storesResponse.data) {
            setStores(storesResponse.data);
          }
        } catch (error) {
          console.error('Failed to load data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [dispatch, companyId]);

  // Filter products
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

    if (filterPriceFrom) {
      result = result.filter(p => p.price >= parseFloat(filterPriceFrom));
    }

    if (filterPriceTo) {
      result = result.filter(p => p.price <= parseFloat(filterPriceTo));
    }

    if (filterStockFrom) {
      result = result.filter(p => p.total_stock >= parseFloat(filterStockFrom));
    }

    if (filterStockTo) {
      result = result.filter(p => p.total_stock <= parseFloat(filterStockTo));
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, searchQuery, selectedCategory, filterPriceFrom, filterPriceTo, filterStockFrom, filterStockTo]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const clearFilters = () => {
    setFilterPreset('');
    setSelectedCategory('');
    setFilterPriceFrom('');
    setFilterPriceTo('');
    setFilterStockFrom('');
    setFilterStockTo('');
  };

  const handleCreateProduct = () => {
    setShowCreatePanel(true);
  };

  return (
    <MainLayout title="Товари та послуги">
      <PageContainer>
        <Breadcrumb>
          <a href="/pos">
            <Home size={16} />
            Головна
          </a>
          <ChevronRight size={16} />
          <span>Товари та послуги / справочник</span>
        </Breadcrumb>

        <PageHeader>
          <PageTitle>Товари та послуги / справочник</PageTitle>
          <HeaderActions>
            <ActionButton>
              <Download size={18} />
              Імпорт товарів
            </ActionButton>
            <ActionButton primary onClick={handleCreateProduct}>
              <Plus size={18} />
              Создать товар
            </ActionButton>
          </HeaderActions>
        </PageHeader>

        <FiltersBar>
          <SearchInputWrapper>
            <Search size={18} />
            <input
              type="text"
              placeholder="Поиск по наименованию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInputWrapper>
          
          <FilterButton
            active={showFilterPanel}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter size={18} />
            Фільтр
          </FilterButton>

          <FilterSelect
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Дії 10 поз.</option>
            <option value="create">Создать документ</option>
            <option value="prices">Цены и скидки</option>
            <option value="categories">Категории и группы</option>
            <option value="other">Другое</option>
          </FilterSelect>

          <ActionDropdown>
            <DropdownButton onClick={() => setShowActionsDropdown(!showActionsDropdown)}>
              Дії 10 поз.
              <ChevronDown size={16} />
            </DropdownButton>
            <DropdownMenu isOpen={showActionsDropdown}>
              <DropdownSection>
                <DropdownSectionTitle>Работа с группой товаров</DropdownSectionTitle>
                <DropdownItem>Цены и скидки</DropdownItem>
                <DropdownItem>Категории и группы</DropdownItem>
                <DropdownItem>Другое</DropdownItem>
                <DropdownItem>Ценники</DropdownItem>
                <DropdownItem>Редактор цен</DropdownItem>
                <DropdownItem>Оценка склада</DropdownItem>
                <DropdownItem>Файл для весов</DropdownItem>
                <DropdownItem>Скачать в Excel</DropdownItem>
              </DropdownSection>
              <DropdownSection>
                <DropdownItemDanger>Удалить</DropdownItemDanger>
              </DropdownSection>
            </DropdownMenu>
          </ActionDropdown>

          <SettingsButton onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}>
            <Settings size={18} />
          </SettingsButton>

          {showSettingsDropdown && (
            <DropdownMenu isOpen={showSettingsDropdown} style={{ right: 0, maxHeight: '500px', overflowY: 'auto' }}>
              <DropdownSection>
                <DropdownSectionTitle>Настройки таблицы</DropdownSectionTitle>
                <CheckboxLabel>
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.photo}
                    onChange={(e) => setVisibleColumns({...visibleColumns, photo: e.target.checked})}
                  />
                  Фотография
                </CheckboxLabel>
                <CheckboxLabel>
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.code}
                    onChange={(e) => setVisibleColumns({...visibleColumns, code: e.target.checked})}
                  />
                  Код
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Налоги
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Штрих-код
                </CheckboxLabel>
                <CheckboxLabel>
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.sku}
                    onChange={(e) => setVisibleColumns({...visibleColumns, sku: e.target.checked})}
                  />
                  Артикул
                </CheckboxLabel>
                <CheckboxLabel>
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.unit}
                    onChange={(e) => setVisibleColumns({...visibleColumns, unit: e.target.checked})}
                  />
                  Единица измерения
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  PLU код
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Срок годности
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Категория
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Страна
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Поставщик
                </CheckboxLabel>
                <CheckboxLabel>
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.price}
                    onChange={(e) => setVisibleColumns({...visibleColumns, price: e.target.checked})}
                  />
                  Цена продажи
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Себестоимость
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Цена закупки
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Создан
                </CheckboxLabel>
                <CheckboxLabel>
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.discount}
                    onChange={(e) => setVisibleColumns({...visibleColumns, discount: e.target.checked})}
                  />
                  Скидка
                </CheckboxLabel>
                <CheckboxLabel>
                  <input type="checkbox" />
                  Мин. остаток
                </CheckboxLabel>
                {stores.map(store => (
                  <CheckboxLabel key={store._id}>
                    <input type="checkbox" defaultChecked />
                    {store.name}
                  </CheckboxLabel>
                ))}
              </DropdownSection>
            </DropdownMenu>
          )}
        </FiltersBar>

        <FilterPanel isOpen={showFilterPanel}>
          <FilterPanelTitle>Пресеты фильтров</FilterPanelTitle>
          <FilterGrid>
            <FilterGroup>
              <FilterLabel>Выберите</FilterLabel>
              <FilterSelect value={filterPreset} onChange={(e) => setFilterPreset(e.target.value)}>
                <option value="">Выберите</option>
                <option value="low_stock">Низкий остаток</option>
                <option value="out_of_stock">Нет в наличии</option>
                <option value="zero_cost">Нулевая себестоимость</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Категории</FilterLabel>
              <FilterSelect value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">Выбрать категорию</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </FilterSelect>
            </FilterGroup>
          </FilterGrid>

          <FilterPanelTitle style={{ marginTop: '24px' }}>Цена</FilterPanelTitle>
          <FilterGrid>
            <FilterGroup>
              <FilterLabel>базовая</FilterLabel>
              <FormRow>
                <FilterInput
                  type="number"
                  placeholder="0"
                  value={filterPriceFrom}
                  onChange={(e) => setFilterPriceFrom(e.target.value)}
                />
                <FilterInput
                  type="number"
                  placeholder="больше"
                  value={filterPriceTo}
                  onChange={(e) => setFilterPriceTo(e.target.value)}
                />
              </FormRow>
            </FilterGroup>
          </FilterGrid>

          <FilterPanelTitle style={{ marginTop: '24px' }}>Остатки</FilterPanelTitle>
          <FilterGrid>
            <FilterGroup>
              <FilterLabel>общие</FilterLabel>
              <FormRow>
                <FilterInput
                  type="number"
                  placeholder="0"
                  value={filterStockFrom}
                  onChange={(e) => setFilterStockFrom(e.target.value)}
                />
                <FilterInput
                  type="number"
                  placeholder="больше"
                  value={filterStockTo}
                  onChange={(e) => setFilterStockTo(e.target.value)}
                />
              </FormRow>
            </FilterGroup>
          </FilterGrid>

          <FilterPanelTitle style={{ marginTop: '24px' }}>Срок годности</FilterPanelTitle>
          <FilterGrid>
            <FilterGroup>
              <FilterLabel>истекает в течение</FilterLabel>
              <FilterSelect>
                <option value="">дней</option>
                <option value="7">7 дней</option>
                <option value="30">30 дней</option>
                <option value="90">90 дней</option>
              </FilterSelect>
            </FilterGroup>
          </FilterGrid>

          <FilterPanelTitle style={{ marginTop: '24px' }}>Изменения товара</FilterPanelTitle>
          <FilterGrid>
            <FilterGroup>
              <FilterLabel>изменен в течение</FilterLabel>
              <FilterSelect>
                <option value="">дней</option>
                <option value="7">7 дней</option>
                <option value="30">30 дней</option>
                <option value="90">90 дней</option>
              </FilterSelect>
            </FilterGroup>
          </FilterGrid>

          <FilterPanelTitle style={{ marginTop: '24px' }}>Продаваемость</FilterPanelTitle>
          <FilterGrid>
            <FilterGroup>
              <FilterLabel>продавался в течение</FilterLabel>
              <FilterSelect>
                <option value="">дней</option>
                <option value="7">7 дней</option>
                <option value="30">30 дней</option>
                <option value="90">90 дней</option>
              </FilterSelect>
            </FilterGroup>
          </FilterGrid>

          <FilterActions>
            <ActionButton primary>Применить</ActionButton>
            <ActionButton onClick={clearFilters}>Сбросить</ActionButton>
            <ActionButton>Сохранить пресет</ActionButton>
          </FilterActions>
        </FilterPanel>

        <TableContainer>
          {loading ? (
            <EmptyState>
              <Package size={64} />
              <h3>Завантаження...</h3>
              <p>Отримуємо дані товарів</p>
            </EmptyState>
          ) : paginatedProducts.length > 0 ? (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th style={{ width: '40px' }}>
                      <input type="checkbox" />
                    </Th>
                    {visibleColumns.photo && <Th style={{ width: '60px' }}></Th>}
                    <Th>Наименование</Th>
                    {visibleColumns.code && <Th>Код</Th>}
                    {visibleColumns.sku && <Th>Артикул</Th>}
                    {visibleColumns.unit && <Th>Ед. изм.</Th>}
                    {visibleColumns.price && <Th style={{ textAlign: 'right' }}>Цена продажи</Th>}
                    {visibleColumns.discount && <Th style={{ textAlign: 'right' }}>Скидка, %</Th>}
                    {stores.map(store => (
                      <Th key={store._id} style={{ textAlign: 'right' }}>
                        {store.name}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(product => (
                    <ProductRow key={product._id}>
                      <Td>
                        <input type="checkbox" />
                      </Td>
                      {visibleColumns.photo && (
                        <Td>
                          <ProductImage>
                            {(product as any).image ? (
                              <img src={(product as any).image} alt={product.name} />
                            ) : (
                              <ImageIcon size={20} />
                            )}
                          </ProductImage>
                        </Td>
                      )}
                      <Td>
                        <ProductInfo>
                          <ProductName>{product.name}</ProductName>
                        </ProductInfo>
                      </Td>
                      {visibleColumns.code && <Td>{product.code || product._id.slice(-4)}</Td>}
                      {visibleColumns.sku && <Td>{product.sku || '-'}</Td>}
                      {visibleColumns.unit && <Td>шт</Td>}
                      {visibleColumns.price && <Td style={{ textAlign: 'right' }}>{formatPrice(product.price)}</Td>}
                      {visibleColumns.discount && <Td style={{ textAlign: 'right' }}>0</Td>}
                      {stores.map(store => (
                        <Td key={store._id} style={{ textAlign: 'right' }}>
                          {product.stock?.[store._id] || 0}
                        </Td>
                      ))}
                    </ProductRow>
                  ))}
                </tbody>
              </Table>
              <Pagination>
                <PageInfo>
                  Страницы {currentPage}
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
      </PageContainer>

      {/* Create Product Slide Panel */}
      <SlidePanelOverlay isOpen={showCreatePanel} onClick={() => setShowCreatePanel(false)} />
      <SlidePanel isOpen={showCreatePanel}>
        <SlidePanelHeader>
          <SlidePanelTitle>Справочник / создание товара</SlidePanelTitle>
          <CloseButton onClick={() => setShowCreatePanel(false)}>
            <X size={20} />
          </CloseButton>
        </SlidePanelHeader>

        <SlidePanelTabs>
          <Tab
            active={createProductType === 'product'}
            onClick={() => setCreateProductType('product')}
          >
            Товар
          </Tab>
          <Tab
            active={createProductType === 'service'}
            onClick={() => setCreateProductType('service')}
          >
            Услуга
          </Tab>
          <Tab
            active={createProductType === 'kit'}
            onClick={() => setCreateProductType('kit')}
          >
            Комплект
          </Tab>
        </SlidePanelTabs>

        <SlidePanelContent>
          {createProductType === 'product' && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
                Основная информация
              </h3>

              <FormGroup>
                <FormLabel>Наименование <span>*</span></FormLabel>
                <FormInput type="text" placeholder="Введите название" />
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <FormLabel>Код товара</FormLabel>
                  <FormInput type="text" placeholder="06142" />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Штрих-код (Сгенерировать)</FormLabel>
                  <FormInput type="text" placeholder="Введите штрих-код" />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <FormLabel>Код УКТЗЕД</FormLabel>
                  <FormInput type="text" />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Код ЕГРПОУ/ЕДРПОУ</FormLabel>
                  <FormInput type="text" />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <FormLabel>Тип маркировки</FormLabel>
                <FormSelect>
                  <option>Без маркировки</option>
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel>Изображение</FormLabel>
                <div style={{ 
                  padding: '40px', 
                  border: `2px dashed ${theme.colors.border}`, 
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: theme.colors.textMuted
                }}>
                  Выберите фото для загрузки<br />
                  или перетащите его сюда
                </div>
              </FormGroup>

              <FormGroup>
                <FormLabel>Категории</FormLabel>
                <FormSelect>
                  <option>Выбрать из списка или введите новую и нажмите Enter</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel>Единица измерения</FormLabel>
                <FormSelect>
                  <option>шт</option>
                  <option>кг</option>
                  <option>л</option>
                  <option>м</option>
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel>Характеристики товара</FormLabel>
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <FormLabel>Высота, см</FormLabel>
                  <FormInput type="number" />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Глубина, см</FormLabel>
                  <FormInput type="number" />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <FormLabel>Фактический вес, кг</FormLabel>
                <FormInput type="number" />
              </FormGroup>

              <FormGroup>
                <FormLabel>Описание</FormLabel>
                <FormTextarea placeholder="Введите описание товара" />
              </FormGroup>

              <FormGroup>
                <FormLabel>Страна</FormLabel>
                <FormSelect>
                  <option>Введите название страны</option>
                </FormSelect>
              </FormGroup>

              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '32px 0 20px' }}>
                Цены
              </h3>

              <FormRow>
                <FormGroup>
                  <FormLabel>Цена закупки</FormLabel>
                  <FormInput type="number" placeholder="0" />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Наценка</FormLabel>
                  <FormInput type="number" placeholder="0" />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <FormLabel>Цена продажи</FormLabel>
                <FormInput type="number" placeholder="0" />
              </FormGroup>

              <CheckboxLabel>
                <input type="checkbox" />
                Товар по свободной цене<br />
                <small style={{ color: theme.colors.textMuted }}>
                  Кассир при продаже может редактировать цену
                </small>
              </CheckboxLabel>

              <CheckboxLabel style={{ marginTop: '12px' }}>
                <input type="checkbox" />
                Установить разные цены продажи в магазинах<br />
                <small style={{ color: theme.colors.textMuted }}>
                  На кассах товар будет продаваться по цене магазина
                </small>
              </CheckboxLabel>

              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '32px 0 20px' }}>
                Скидка
              </h3>

              <FormRow>
                <FormGroup>
                  <FormLabel>Скидка</FormLabel>
                  <FormInput type="number" placeholder="0" />
                </FormGroup>
                <FormGroup>
                  <FormLabel>%</FormLabel>
                  <FormInput type="number" placeholder="0" disabled />
                </FormGroup>
              </FormRow>

              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '32px 0 20px' }}>
                Налоги
              </h3>

              <FormGroup>
                <FormLabel>Налоги</FormLabel>
                <FormSelect>
                  <option>Не облагается налогом</option>
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel>Код налога</FormLabel>
                <FormInput type="text" />
              </FormGroup>

              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '32px 0 20px' }}>
                Склад
              </h3>

              <FormGroup>
                <FormLabel>Группа (Очистить)</FormLabel>
                <div style={{ 
                  padding: '12px', 
                  background: theme.colors.gray50, 
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}>
                  Выбрана группа : Антистресс
                </div>
              </FormGroup>

              <FormGroup>
                <FormLabel>Выберите поставщика</FormLabel>
                <FormSelect>
                  <option>введите</option>
                </FormSelect>
              </FormGroup>

              <FormGroup>
                <FormLabel>Минимальный остаток</FormLabel>
                <FormInput type="number" placeholder="шт" />
              </FormGroup>

              <CheckboxLabel>
                <input type="checkbox" />
                Товар с модификациями<br />
                <small style={{ color: theme.colors.textMuted }}>
                  Будут созданы вариации товара (например, по цвету, размеру)
                </small>
              </CheckboxLabel>

              <CheckboxLabel style={{ marginTop: '12px' }}>
                <input type="checkbox" />
                Ввести начальные остатки<br />
                <small style={{ color: theme.colors.textMuted }}>
                  Будут созданы документы оприходования
                </small>
              </CheckboxLabel>

              <FormGroup>
                <FormLabel>Срок годности</FormLabel>
                <FormInput type="date" placeholder="ДД/ММ/ГГГГ" />
              </FormGroup>
            </>
          )}

          {createProductType === 'service' && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
                Основная информация
              </h3>
              <FormGroup>
                <FormLabel>Наименование <span>*</span></FormLabel>
                <FormInput type="text" placeholder="Введите название услуги" />
              </FormGroup>
              <FormGroup>
                <FormLabel>Цена</FormLabel>
                <FormInput type="number" placeholder="0" />
              </FormGroup>
              <FormGroup>
                <FormLabel>Описание</FormLabel>
                <FormTextarea placeholder="Введите описание услуги" />
              </FormGroup>
            </>
          )}

          {createProductType === 'kit' && (
            <>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
                Основная информация
              </h3>
              <FormGroup>
                <FormLabel>Наименование <span>*</span></FormLabel>
                <FormInput type="text" placeholder="Введите название комплекта" />
              </FormGroup>
              <FormGroup>
                <FormLabel>Цена</FormLabel>
                <FormInput type="number" placeholder="0" />
              </FormGroup>
              <FormGroup>
                <FormLabel>Описание</FormLabel>
                <FormTextarea placeholder="Введите описание комплекта" />
              </FormGroup>
            </>
          )}
        </SlidePanelContent>

        <SlidePanelFooter>
          <ActionButton onClick={() => setShowCreatePanel(false)}>
            Отменить
          </ActionButton>
          <ActionButton primary>
            Сохранить
          </ActionButton>
        </SlidePanelFooter>
      </SlidePanel>
    </MainLayout>
  );
}
