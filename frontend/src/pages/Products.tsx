import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Filter,
  Download,
  ChevronRight,
  Home,
  Settings,
  ChevronDown,
  Image as ImageIcon,
  X,
  MoreVertical,
  Upload,
  Tag,
  FileText,
  Scale,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchProducts, fetchCategories } from '../store/slices/dataSlice';
import { dataApi } from '../services/api';
import type { Product, Store } from '../types';
import { theme } from '../styles/GlobalStyles';

// ============================================
// Styled Components
// ============================================

const PageContainer = styled.div``;

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

const ActionButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => props.$primary ? '#4caf50' : 'white'};
  color: ${props => props.$primary ? 'white' : theme.colors.textPrimary};
  border: ${props => props.$primary ? 'none' : `1px solid ${theme.colors.border}`};
  cursor: pointer;

  &:hover {
    background: ${props => props.$primary ? '#45a049' : theme.colors.gray100};
  }
`;

const FiltersBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const SearchInput = styled.div`
  flex: 1;
  max-width: 300px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
  }
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid ${props => props.$active ? theme.colors.primary : theme.colors.border};
  background: ${props => props.$active ? theme.colors.primaryLight : 'white'};
  color: ${theme.colors.textPrimary};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  position: relative;
`;

const Dropdown = styled.div<{ $show: boolean }>`
  display: ${props => props.$show ? 'block' : 'none'};
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
`;

const DropdownItem = styled.div<{ $danger?: boolean }>`
  padding: 10px 16px;
  font-size: 14px;
  color: ${props => props.$danger ? '#f44336' : theme.colors.textPrimary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: ${theme.colors.gray50};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: ${theme.colors.border};
  margin: 4px 0;
`;

const FilterPanel = styled.div<{ $show: boolean }>`
  display: ${props => props.$show ? 'block' : 'none'};
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const FilterSection = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FilterLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin-bottom: 10px;
`;

const FilterCheckboxGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const FilterCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  cursor: pointer;

  input {
    cursor: pointer;
  }
`;

const FilterSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: ${theme.colors.primary};
  }
`;

const FilterInputGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const FilterInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: ${theme.colors.primary};
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const FilterActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'outline' }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: ${props => 
    props.$variant === 'outline' ? `1px solid ${theme.colors.border}` : 'none'
  };
  background: ${props => {
    if (props.$variant === 'primary') return '#4caf50';
    if (props.$variant === 'outline') return 'white';
    return theme.colors.gray100;
  }};
  color: ${props => props.$variant === 'primary' ? 'white' : theme.colors.textPrimary};

  &:hover {
    opacity: 0.9;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid ${theme.colors.border};
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1400px;
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
  &:hover {
    background: ${theme.colors.gray50};
  }
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
`;

const ProductName = styled.span`
  font-weight: 500;
  color: ${theme.colors.primary};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid ${theme.colors.border};
`;

const SlidePanelOverlay = styled.div<{ $show: boolean }>`
  display: ${props => props.$show ? 'block' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const SlidePanel = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.$show ? '0' : '-600px'};
  width: 600px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const SlidePanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const SlidePanelTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${theme.colors.textSecondary};
  padding: 4px;

  &:hover {
    color: ${theme.colors.textPrimary};
  }
`;

const SlidePanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const SlidePanelFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  gap: 12px;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 2px;
  border-bottom: 1px solid ${theme.colors.border};
  margin-bottom: 20px;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border: none;
  background: ${props => props.$active ? 'white' : theme.colors.gray50};
  color: ${props => props.$active ? theme.colors.primary : theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.$active ? theme.colors.primary : 'transparent'};

  &:hover {
    background: white;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.textPrimary};
  margin-bottom: 8px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  outline: none;

  &:focus {
    border-color: ${theme.colors.primary};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  min-height: 100px;
  resize: vertical;

  &:focus {
    border-color: ${theme.colors.primary};
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const Modal = styled.div<{ $show: boolean }>`
  display: ${props => props.$show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1001;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const CategoryTree = styled.div`
  padding: 10px 0;
`;

const CategoryItem = styled.div<{ $level: number }>`
  padding: 8px 12px;
  padding-left: ${props => 12 + props.$level * 20}px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: ${theme.colors.gray50};
  }
`;

// ============================================
// Component
// ============================================

export default function Products() {
  const dispatch = useAppDispatch();
  const { companyId } = useAppSelector(state => state.auth);
  const { products, categories } = useAppSelector(state => state.data);
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [createPanelTab, setCreatePanelTab] = useState<'product' | 'service' | 'kit'>('product');
  
  // Filter states
  const [filterPresets, setFilterPresets] = useState({
    product: true,
    service: true,
    kit: true,
  });
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriceFrom, setFilterPriceFrom] = useState('');
  const [filterPriceTo, setFilterPriceTo] = useState('');
  const [filterStockFrom, setFilterStockFrom] = useState('');
  const [filterStockTo, setFilterStockTo] = useState('');
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    photo: true,
    code: true,
    barcode: false,
    article: true,
    unit: true,
    plu: false,
    expiry: false,
    category: false,
    country: false,
    supplier: false,
    salePrice: true,
    purchasePrice: false,
    costPrice: false,
    discount: true,
    minStock: false,
  });
  
  const itemsPerPage = 20;

  useEffect(() => {
    const loadData = async () => {
      if (companyId) {
        dispatch(fetchProducts({ companyId }));
        dispatch(fetchCategories(companyId));
        
        try {
          const storesResponse = await dataApi.getStores(companyId);
          if (storesResponse.status && storesResponse.data) {
            setStores(storesResponse.data);
          }
        } catch (error) {
          console.error('Products page: Failed to load stores:', error);
        }
      }
    };
    
    loadData();
  }, [dispatch, companyId]);

  useEffect(() => {
    let result = products.filter(p => !p.deleted);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    if (filterCategory) {
      result = result.filter(p => 
        p.categories && p.categories.includes(filterCategory)
      );
    }

    if (filterPriceFrom) {
      const priceFrom = parseFloat(filterPriceFrom);
      result = result.filter(p => parseFloat(String(p.price || 0)) >= priceFrom);
    }
    if (filterPriceTo) {
      const priceTo = parseFloat(filterPriceTo);
      result = result.filter(p => parseFloat(String(p.price || 0)) <= priceTo);
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, searchQuery, filterPresets, filterCategory, filterPriceFrom, filterPriceTo]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleApplyFilters = () => {
    // Filters are applied in real-time via useEffect
    setShowFilterPanel(false);
  };

  const handleResetFilters = () => {
    setFilterPresets({ product: true, service: true, kit: true });
    setFilterCategory('');
    setFilterPriceFrom('');
    setFilterPriceTo('');
    setFilterStockFrom('');
    setFilterStockTo('');
  };

  const toggleColumnVisibility = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  return (
    <MainLayout title="Товари та послуги">
      <>
        <PageContainer>
          <Breadcrumb>
            <a href="/pos">
              <Home size={16} />
              Головна
            </a>
            <ChevronRight size={16} />
            <span>Антистресс</span>
          </Breadcrumb>

          <PageHeader>
            <PageTitle>Товари та послуги / справочник</PageTitle>
            <HeaderActions>
              <ActionButton>
                <Download size={18} />
                Імпорт товарів
              </ActionButton>
              <ActionButton $primary onClick={() => setShowCreatePanel(true)}>
                <Plus size={18} />
                Создать товар
              </ActionButton>
            </HeaderActions>
          </PageHeader>

          <FiltersBar>
            <SearchInput>
              <Search size={18} />
              <input
                type="text"
                placeholder="Поиск по наименованию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchInput>
            
            <FilterButton
              $active={showFilterPanel}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <Filter size={18} />
              Фільтр
            </FilterButton>

            <FilterButton onClick={() => setShowActionsDropdown(!showActionsDropdown)}>
              <ChevronDown size={16} />
              Дії 10 поз.
              <Dropdown $show={showActionsDropdown}>
                <DropdownItem onClick={() => setShowCategoryModal(true)}>
                  <FileText size={16} />
                  Створити документ
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem>
                  <Tag size={16} />
                  Ціни та знижки
                </DropdownItem>
                <DropdownItem onClick={() => setShowCategoryModal(true)}>
                  <FileText size={16} />
                  Категорії та групи
                </DropdownItem>
                <DropdownItem>
                  <MoreVertical size={16} />
                  Друге
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem>
                  <Tag size={16} />
                  Цінники
                </DropdownItem>
                <DropdownItem>
                  <Tag size={16} />
                  Редактор цен
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem>
                  <Scale size={16} />
                  Оцінка складу
                </DropdownItem>
                <DropdownItem>
                  <Scale size={16} />
                  Файл для весов
                </DropdownItem>
                <DropdownItem>
                  <Download size={16} />
                  Скачать в Excel
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem $danger>
                  <Trash2 size={16} />
                  Удалить
                </DropdownItem>
              </Dropdown>
            </FilterButton>

            <FilterButton onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}>
              <Settings size={18} />
              <Dropdown $show={showSettingsDropdown}>
                <DropdownItem onClick={() => toggleColumnVisibility('photo')}>
                  <input type="checkbox" checked={visibleColumns.photo} readOnly />
                  Фотографія
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('code')}>
                  <input type="checkbox" checked={visibleColumns.code} readOnly />
                  Код
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('barcode')}>
                  <input type="checkbox" checked={visibleColumns.barcode} readOnly />
                  Штрих-код
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('article')}>
                  <input type="checkbox" checked={visibleColumns.article} readOnly />
                  Артикул
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('unit')}>
                  <input type="checkbox" checked={visibleColumns.unit} readOnly />
                  Единиця вимірення
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('plu')}>
                  <input type="checkbox" checked={visibleColumns.plu} readOnly />
                  PLU код
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('expiry')}>
                  <input type="checkbox" checked={visibleColumns.expiry} readOnly />
                  Срок годности
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('category')}>
                  <input type="checkbox" checked={visibleColumns.category} readOnly />
                  Категорія
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('country')}>
                  <input type="checkbox" checked={visibleColumns.country} readOnly />
                  Страна
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('supplier')}>
                  <input type="checkbox" checked={visibleColumns.supplier} readOnly />
                  Постачик
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('salePrice')}>
                  <input type="checkbox" checked={visibleColumns.salePrice} readOnly />
                  Ціна продажи
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('purchasePrice')}>
                  <input type="checkbox" checked={visibleColumns.purchasePrice} readOnly />
                  Себестоимость
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('costPrice')}>
                  <input type="checkbox" checked={visibleColumns.costPrice} readOnly />
                  Ціна закупки
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('discount')}>
                  <input type="checkbox" checked={visibleColumns.discount} readOnly />
                  Скидка
                </DropdownItem>
                <DropdownItem onClick={() => toggleColumnVisibility('minStock')}>
                  <input type="checkbox" checked={visibleColumns.minStock} readOnly />
                  Мін. остаток
                </DropdownItem>
                <DropdownDivider />
                {stores.map(store => (
                  <DropdownItem key={store._id}>
                    <input type="checkbox" checked readOnly />
                    {store.name}
                  </DropdownItem>
                ))}
              </Dropdown>
            </FilterButton>
          </FiltersBar>

          {/* Filter Panel */}
          <FilterPanel $show={showFilterPanel}>
            <FilterSection>
              <FilterLabel>Пресеты фільтрів</FilterLabel>
              <FilterCheckboxGroup>
                <FilterCheckbox>
                  <input
                    type="checkbox"
                    checked={filterPresets.product}
                    onChange={(e) => setFilterPresets(prev => ({ ...prev, product: e.target.checked }))}
                  />
                  Товар
                </FilterCheckbox>
                <FilterCheckbox>
                  <input
                    type="checkbox"
                    checked={filterPresets.service}
                    onChange={(e) => setFilterPresets(prev => ({ ...prev, service: e.target.checked }))}
                  />
                  Услуга
                </FilterCheckbox>
                <FilterCheckbox>
                  <input
                    type="checkbox"
                    checked={filterPresets.kit}
                    onChange={(e) => setFilterPresets(prev => ({ ...prev, kit: e.target.checked }))}
                  />
                  Комплект
                </FilterCheckbox>
              </FilterCheckboxGroup>
            </FilterSection>

            <FilterSection>
              <FilterLabel>Категорії</FilterLabel>
              <FilterSelect value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">Вибрати категорію</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </FilterSelect>
            </FilterSection>

            <FilterSection>
              <FilterLabel>Ціна</FilterLabel>
              <FilterInputGroup>
                <FilterSelect>
                  <option>базовая</option>
                </FilterSelect>
                <FilterSelect>
                  <option>больше</option>
                  <option>меньше</option>
                  <option>равно</option>
                </FilterSelect>
                <FilterInput
                  type="number"
                  placeholder="0"
                  value={filterPriceFrom}
                  onChange={(e) => setFilterPriceFrom(e.target.value)}
                />
                <button>+</button>
              </FilterInputGroup>
            </FilterSection>

            <FilterSection>
              <FilterLabel>Остатки</FilterLabel>
              <FilterInputGroup>
                <FilterSelect>
                  <option>общие</option>
                </FilterSelect>
                <FilterSelect>
                  <option>больше</option>
                  <option>меньше</option>
                  <option>равно</option>
                </FilterSelect>
                <FilterInput
                  type="number"
                  placeholder="0"
                  value={filterStockFrom}
                  onChange={(e) => setFilterStockFrom(e.target.value)}
                />
                <button>+</button>
              </FilterInputGroup>
            </FilterSection>

            <FilterSection>
              <FilterLabel>Срок годности</FilterLabel>
              <FilterSelect>
                <option>истекает в течение</option>
              </FilterSelect>
              <FilterInputGroup>
                <FilterInput type="number" placeholder="дней" />
              </FilterInputGroup>
            </FilterSection>

            <FilterSection>
              <FilterLabel>Изменения товара</FilterLabel>
              <FilterSelect>
                <option>изменен в течение</option>
              </FilterSelect>
              <FilterInputGroup>
                <FilterInput type="number" placeholder="дней" />
              </FilterInputGroup>
            </FilterSection>

            <FilterSection>
              <FilterLabel>Продаваемость</FilterLabel>
              <FilterSelect>
                <option>продавался в течение</option>
              </FilterSelect>
              <FilterInputGroup>
                <FilterInput type="number" placeholder="дней" />
              </FilterInputGroup>
            </FilterSection>

            <FilterActions>
              <FilterActionButton $variant="primary" onClick={handleApplyFilters}>
                Применить
              </FilterActionButton>
              <FilterActionButton onClick={handleResetFilters}>
                Сбросить
              </FilterActionButton>
              <FilterActionButton $variant="outline">
                Сохранить пресет
              </FilterActionButton>
            </FilterActions>
          </FilterPanel>

          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <Th style={{ width: '40px' }}>
                    <input type="checkbox" />
                  </Th>
                  {visibleColumns.photo && <Th style={{ width: '60px' }}></Th>}
                  <Th>Наименование</Th>
                  {visibleColumns.code && <Th>Код</Th>}
                  {visibleColumns.barcode && <Th>Штрих-код</Th>}
                  {visibleColumns.article && <Th>Артикул</Th>}
                  {visibleColumns.unit && <Th>Ед. изм.</Th>}
                  {visibleColumns.salePrice && <Th style={{ textAlign: 'right' }}>Цена продажи</Th>}
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
                          <ImageIcon size={20} />
                        </ProductImage>
                      </Td>
                    )}
                    <Td>
                      <ProductName onClick={() => setShowCreatePanel(true)}>
                        {product.name}
                      </ProductName>
                    </Td>
                    {visibleColumns.code && <Td>{product.code || product._id.slice(-4)}</Td>}
                    {visibleColumns.barcode && <Td>{product.barcode || '-'}</Td>}
                    {visibleColumns.article && <Td>{product.sku || '-'}</Td>}
                    {visibleColumns.unit && <Td>шт</Td>}
                    {visibleColumns.salePrice && (
                      <Td style={{ textAlign: 'right' }}>
                        {parseFloat(String(product.price || 0)).toFixed(2)}
                      </Td>
                    )}
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
              <span>Страницы {currentPage}</span>
              <div>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  ←
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  →
                </button>
              </div>
            </Pagination>
          </TableContainer>
        </PageContainer>

        {/* Create Product Slide Panel */}
        <SlidePanelOverlay $show={showCreatePanel} onClick={() => setShowCreatePanel(false)} />
        <SlidePanel $show={showCreatePanel}>
          <SlidePanelHeader>
            <SlidePanelTitle>Справочник / создание товара</SlidePanelTitle>
            <CloseButton onClick={() => setShowCreatePanel(false)}>
              <X size={24} />
            </CloseButton>
          </SlidePanelHeader>

          <TabsContainer>
            <Tab
              $active={createPanelTab === 'product'}
              onClick={() => setCreatePanelTab('product')}
            >
              Товар
            </Tab>
            <Tab
              $active={createPanelTab === 'service'}
              onClick={() => setCreatePanelTab('service')}
            >
              Услуга
            </Tab>
            <Tab
              $active={createPanelTab === 'kit'}
              onClick={() => setCreatePanelTab('kit')}
            >
              Комплект
            </Tab>
          </TabsContainer>

          <SlidePanelContent>
            <FormGroup>
              <FormLabel>Наименование *</FormLabel>
              <FormInput type="text" placeholder="Введите наименование" />
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
                <FormLabel>Код ЄГРПОУ/ЄДРПОУ</FormLabel>
                <FormInput type="text" />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <FormLabel>Тип маркировки</FormLabel>
              <FilterSelect>
                <option>Без маркировки</option>
              </FilterSelect>
            </FormGroup>

            <FormGroup>
              <FormLabel>Изображение</FormLabel>
              <ActionButton>
                <Upload size={16} />
                Выберите фото для загрузки
              </ActionButton>
              <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginTop: '8px' }}>
                или перетащите его мышкой
              </div>
            </FormGroup>

            <FormGroup>
              <FormLabel>Категории</FormLabel>
              <FilterSelect>
                <option>Выберите из списка или введите новую и нажмите Enter</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </FilterSelect>
            </FormGroup>

            <FormGroup>
              <FormLabel>Единица измерения</FormLabel>
              <FilterSelect>
                <option>шт</option>
              </FilterSelect>
              <ActionButton style={{ marginTop: '8px' }}>
                Добавити упаковку
              </ActionButton>
            </FormGroup>

            <FormGroup>
              <FormLabel>Характеристики товара</FormLabel>
              <FormRow>
                <FormInput type="text" placeholder="Ширина, см" />
                <FormInput type="text" placeholder="Глубина, см" />
              </FormRow>
              <FormInput type="text" placeholder="Фактический вес, кг" style={{ marginTop: '10px' }} />
            </FormGroup>

            <FormGroup>
              <FormLabel>Описание</FormLabel>
              <FormTextarea placeholder="Введите описание товара..." />
            </FormGroup>

            <FormGroup>
              <FormLabel>Страна</FormLabel>
              <FilterSelect>
                <option>Введите название страны</option>
              </FilterSelect>
            </FormGroup>

            <FormGroup>
              <FormLabel>Ціни</FormLabel>
              <FormRow>
                <div>
                  <FormLabel>Ціна закупки</FormLabel>
                  <FilterInputGroup>
                    <FormInput type="number" placeholder="0" />
                    <span>грн</span>
                  </FilterInputGroup>
                </div>
                <div>
                  <FormLabel>Націнка</FormLabel>
                  <FilterInputGroup>
                    <FormInput type="number" placeholder="0" />
                    <span>%</span>
                  </FilterInputGroup>
                </div>
              </FormRow>
              <FormRow style={{ marginTop: '10px' }}>
                <div>
                  <FormLabel>Ціна продажи</FormLabel>
                  <FilterInputGroup>
                    <FormInput type="number" placeholder="0" />
                    <span>грн</span>
                  </FilterInputGroup>
                </div>
              </FormRow>
              <FilterCheckbox style={{ marginTop: '10px' }}>
                <input type="checkbox" />
                Товар по свободной цене
              </FilterCheckbox>
              <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginTop: '4px' }}>
                Кассир при продаже может редактировать цену
              </div>
              <FilterCheckbox style={{ marginTop: '10px' }}>
                <input type="checkbox" />
                Установить різніце ціни продажів в магазинах
              </FilterCheckbox>
              <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginTop: '4px' }}>
                На кассах товар будет продаваться по цене магазина
              </div>
            </FormGroup>

            <FormGroup>
              <FormLabel>Скидка</FormLabel>
              <FilterInputGroup>
                <FormInput type="number" placeholder="0" />
                <span>%</span>
              </FilterInputGroup>
            </FormGroup>

            <FormGroup>
              <FormLabel>Налоги</FormLabel>
              <FilterSelect>
                <option>Не облагается налогом</option>
              </FilterSelect>
              <FormLabel style={{ marginTop: '10px' }}>Код налога</FormLabel>
              <FilterSelect>
                <option>Введите код и нажмите Enter</option>
              </FilterSelect>
            </FormGroup>

            <FormGroup>
              <FormLabel>Склад</FormLabel>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                Група (Очистить)
              </div>
              <ActionButton>
                Вибрана группа : Антистресс
              </ActionButton>
              <FormRow style={{ marginTop: '10px' }}>
                <div>
                  <FormLabel>Виберите постачика</FormLabel>
                  <FilterSelect>
                    <option>введіть</option>
                  </FilterSelect>
                </div>
                <div>
                  <FormLabel>Мінімальний остаток</FormLabel>
                  <FilterInputGroup>
                    <FormInput type="number" placeholder="0" />
                    <span>шт</span>
                  </FilterInputGroup>
                </div>
              </FormRow>
              <FilterCheckbox style={{ marginTop: '10px' }}>
                <input type="checkbox" />
                Товар з модифікаціями
              </FilterCheckbox>
              <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginTop: '4px' }}>
                Будут созданы варианты товара (например, по цвету, размеру)
              </div>
              <FilterCheckbox style={{ marginTop: '10px' }}>
                <input type="checkbox" />
                Ввести начальные остатки
              </FilterCheckbox>
              <div style={{ fontSize: '12px', color: theme.colors.textMuted, marginTop: '4px' }}>
                Будут созданы документы оприходования
              </div>
              <FormLabel style={{ marginTop: '10px' }}>Срок годности</FormLabel>
              <FormInput type="text" placeholder="ДД/ММ/ГГГГ" />
            </FormGroup>
          </SlidePanelContent>

          <SlidePanelFooter>
            <ActionButton onClick={() => setShowCreatePanel(false)}>
              <X size={18} />
              Закрити
            </ActionButton>
            <ActionButton $primary>
              Сохранить
            </ActionButton>
          </SlidePanelFooter>
        </SlidePanel>

        {/* Category Modal */}
        <Modal $show={showCategoryModal} onClick={() => setShowCategoryModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Работа с группой товаров</ModalTitle>
              <CloseButton onClick={() => setShowCategoryModal(false)}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <CategoryTree>
                <CategoryItem $level={0}>
                  <ChevronRight size={16} />
                  Товари і услуги
                </CategoryItem>
                {categories.map(cat => (
                  <CategoryItem key={cat} $level={1}>
                    {cat}
                  </CategoryItem>
                ))}
              </CategoryTree>
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    </MainLayout>
  );
}
