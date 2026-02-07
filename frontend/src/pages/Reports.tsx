import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  BarChart3,
  DollarSign,
  Package,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  X,
  Download,
  Calendar,
  Settings,
  HelpCircle,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { fetchProducts, fetchDocuments } from '../store/slices/dataSlice';
import type { Product, Document } from '../types';
import { theme } from '../styles/GlobalStyles';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

// ============================================
// Interfaces
// ============================================
interface CategorySummary {
  name: string;
  count: number;
  revenue: number;
  sold: number;
  profit: number;
  marginality: number;
  children?: CategorySummary[];
  expanded?: boolean;
}

// ============================================
// Styled Components
// ============================================
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow: hidden;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 20px;
  padding: 16px 0;
`;

// Report Type Selection
const ReportTypesGrid = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const ReportTypeCard = styled.div<{ selected?: boolean; disabled?: boolean }>`
  flex: 1;
  max-width: 220px;
  padding: 20px;
  background: ${props => props.selected ? theme.colors.primary : '#f0f4f8'};
  border-radius: 12px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  position: relative;
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};

  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : theme.shadows.md};
  }
`;

const ReportTypeBadge = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  background: #64748b;
  color: white;
  font-size: 10px;
  border-radius: 4px;
`;

const ReportTypeLabel = styled.div<{ light?: boolean }>`
  font-size: 11px;
  color: ${props => props.light ? 'rgba(255,255,255,0.7)' : '#6b7280'};
  margin-bottom: 4px;
`;

const ReportTypeName = styled.div<{ light?: boolean }>`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.light ? 'white' : theme.colors.textPrimary};
`;

// Tabs
const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${props => props.active ? 'white' : 'transparent'};
  border: 1px solid ${props => props.active ? theme.colors.border : 'transparent'};
  border-radius: 4px;
  font-size: 14px;
  color: ${props => props.active ? theme.colors.textPrimary : theme.colors.textSecondary};
  cursor: pointer;

  &:hover {
    background: ${props => props.active ? 'white' : '#f5f5f5'};
  }
`;

const AddTabButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.textMuted};

  &:hover {
    background: #f5f5f5;
  }
`;

// Filters Bar
const FiltersBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px 8px 0 0;
`;

const FilterButton = styled.button<{ hasValue?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.hasValue ? '#e0f2fe' : 'white'};
  border: 1px solid ${props => props.hasValue ? '#0ea5e9' : theme.colors.border};
  border-radius: 4px;
  font-size: 13px;
  color: ${props => props.hasValue ? '#0284c7' : theme.colors.textSecondary};

  &:hover {
    background: ${props => props.hasValue ? '#bae6fd' : '#f5f5f5'};
  }
`;

const FilterClear = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  margin-left: 4px;
  color: inherit;
  
  &:hover {
    opacity: 0.7;
  }
`;

const ToolbarSpacer = styled.div`
  flex: 1;
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 4px;
  color: ${theme.colors.textMuted};

  &:hover {
    background: #f5f5f5;
    color: ${theme.colors.textPrimary};
  }
`;

// Table
const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-top: none;
  border-radius: 0 0 8px 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
`;

const Thead = styled.thead`
  position: sticky;
  top: 0;
  background: #f9fafb;
  z-index: 10;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  border-bottom: 1px solid ${theme.colors.border};
  white-space: nowrap;

  &:first-child {
    padding-left: 16px;
  }
`;

const ThWithHelp = styled(Th)`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Tr = styled.tr<{ level?: number }>`
  cursor: pointer;
  background: ${props => props.level && props.level > 0 ? '#fafafa' : 'white'};
  
  &:hover {
    background: #f5f5f5;
  }
`;

const Td = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  border-bottom: 1px solid ${theme.colors.border};
  vertical-align: middle;
`;

const ExpandCell = styled(Td)`
  width: 40px;
  padding-right: 0;
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: ${theme.colors.textMuted};

  &:hover {
    background: #e5e7eb;
  }
`;

const CategoryCell = styled(Td)<{ level?: number }>`
  padding-left: ${props => 16 + (props.level || 0) * 24}px;
`;

const CategoryName = styled.span`
  color: ${theme.colors.primary};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const CountLink = styled.span`
  color: ${theme.colors.primary};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const TotalRow = styled.tr`
  background: #f9fafb;
  font-weight: 600;
`;

// Slide Panel Styles
const PanelOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 100;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const SlidePanel = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 500px;
  max-width: 100%;
  height: 100%;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 101;
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const PanelCloseButton = styled.button`
  padding: 8px;
  border-radius: 4px;
  color: ${theme.colors.textMuted};
  &:hover {
    background: #f5f5f5;
  }
`;

const PanelActions = styled.div`
  display: flex;
  gap: 8px;
`;

const EditButton = styled.button`
  padding: 8px 16px;
  background: ${theme.colors.primary};
  color: white;
  border-radius: 4px;
  font-size: 14px;
  &:hover {
    background: ${theme.colors.primaryHover};
  }
`;

const DeleteButton = styled.button`
  padding: 8px 16px;
  background: white;
  color: ${theme.colors.danger};
  border: 1px solid ${theme.colors.danger};
  border-radius: 4px;
  font-size: 14px;
  &:hover {
    background: #fef2f2;
  }
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const ProductImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const PanelTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
`;

const PanelLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
`;

const InfoGrid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  font-size: 14px;
`;

const InfoLabel = styled.span`
  color: ${theme.colors.textMuted};
`;

const InfoValue = styled.span`
  color: ${theme.colors.textPrimary};
`;

// ============================================
// Component
// ============================================
export default function Reports() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { products, documents } = useAppSelector(state => state.data);

  const [reportType, setReportType] = useState<'sales' | 'warehouse' | 'finance'>('sales');
  const [activeTab, setActiveTab] = useState<'reports' | 'dates'>('reports');
  const [dateFrom, setDateFrom] = useState(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState(new Date());
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchProducts({ companyId: user._client }));
      dispatch(fetchDocuments({ companyId: user._client }));
    }
  }, [dispatch, user]);

  // Calculate category summaries from products and documents
  useEffect(() => {
    if (!products.length || !documents.length) {
      setCategorySummaries([]);
      return;
    }

    // Group products by category
    const categoryMap = new Map<string, { products: Product[]; sales: Document[] }>();
    
    products.forEach(product => {
      const categoryName = product.categories?.[0] || 'Без категорії';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { products: [], sales: [] });
      }
      categoryMap.get(categoryName)!.products.push(product);
    });

    // Calculate sales data
    const salesDocs = documents.filter(d => 
      d.type === 'sales' && 
      d.date && 
      new Date(d.date * 1000) >= dateFrom && 
      new Date(d.date * 1000) <= dateTo
    );

    const summaries: CategorySummary[] = [];
    let totalCount = 0;
    let totalRevenue = 0;
    let totalSold = 0;
    let totalProfit = 0;

    categoryMap.forEach((data, categoryName) => {
      const catSales = salesDocs.filter(d => 
        d.products?.some(p => data.products.some(dp => dp._id === p._id))
      );
      
      const revenue = catSales.reduce((s, d) => s + (d.total || 0), 0);
      const sold = catSales.reduce((s, d) => s + (d.products?.length || 0), 0);
      const cost = catSales.reduce((s, d) => s + (d.cost || d.total * 0.6 || 0), 0);
      const profit = revenue - cost;
      const marginality = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
      
      const summary: CategorySummary = {
        name: categoryName,
        count: catSales.length,
        revenue,
        sold,
        profit,
        marginality,
      };

      summaries.push(summary);
      totalCount += summary.count;
      totalRevenue += revenue;
      totalSold += sold;
      totalProfit += profit;
    });

    // Sort by revenue descending
    summaries.sort((a, b) => b.revenue - a.revenue);

    // Add totals row at the beginning
    const totalMarginality = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    summaries.unshift({
      name: 'Ітого',
      count: totalCount,
      revenue: totalRevenue,
      sold: totalSold,
      profit: totalProfit,
      marginality: totalMarginality,
    });

    setCategorySummaries(summaries);
  }, [products, documents, dateFrom, dateTo]);

  const formatPrice = (price: number) => {
    const parts = (price || 0).toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',');
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const openProductPanel = (product: Product) => {
    setSelectedProduct(product);
  };

  const closePanel = () => {
    setSelectedProduct(null);
  };

  // Get products for a category
  const getCategoryProducts = (categoryName: string) => {
    return products.filter(p => (p.categories?.[0] || 'Без категорії') === categoryName);
  };

  return (
    <MainLayout title="Звіти">
      <PageContainer>
        <PageTitle>Виберіть тип звіту</PageTitle>

        <ReportTypesGrid>
          <ReportTypeCard 
            selected={reportType === 'sales'}
            onClick={() => setReportType('sales')}
          >
            <ReportTypeLabel light={reportType === 'sales'}>
              Конструктор отчётов
            </ReportTypeLabel>
            <ReportTypeName light={reportType === 'sales'}>
              Продажі
            </ReportTypeName>
          </ReportTypeCard>

          <ReportTypeCard disabled>
            <ReportTypeBadge>В розробці</ReportTypeBadge>
            <ReportTypeLabel>Конструктор отчётов</ReportTypeLabel>
            <ReportTypeName>Склад</ReportTypeName>
          </ReportTypeCard>

          <ReportTypeCard disabled>
            <ReportTypeBadge>В розробці</ReportTypeBadge>
            <ReportTypeLabel>Конструктор отчётов</ReportTypeLabel>
            <ReportTypeName>Фінанси</ReportTypeName>
          </ReportTypeCard>
        </ReportTypesGrid>

        <TabsContainer>
          <Tab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>
            <Package size={16} />
            Отчёти
          </Tab>
          <Tab active={activeTab === 'dates'} onClick={() => setActiveTab('dates')}>
            <Calendar size={16} />
            Отчёт по датам
          </Tab>
          <AddTabButton>
            <Plus size={16} />
          </AddTabButton>
        </TabsContainer>

        <FiltersBar>
          <FilterButton>
            <Settings size={14} />
            Групування
          </FilterButton>
          <FilterButton>
            <BarChart3 size={14} />
            Фільтр
          </FilterButton>
          <FilterButton hasValue>
            Дата
            <span style={{ marginLeft: 4 }}>
              {format(dateFrom, 'd MMM', { locale: ru })} — {format(dateTo, 'd MMM', { locale: ru })}
            </span>
            <FilterClear onClick={() => {
              setDateFrom(subDays(new Date(), 7));
              setDateTo(new Date());
            }}>
              <X size={14} />
            </FilterClear>
          </FilterButton>
          <ToolbarSpacer />
          <ToolbarButton>
            <Download size={18} />
          </ToolbarButton>
          <ToolbarButton>
            <Settings size={18} />
          </ToolbarButton>
        </FiltersBar>

        <TableContainer>
          <Table>
            <Thead>
              <tr>
                <Th style={{ width: 40 }}></Th>
                <Th>Найменування</Th>
                <ThWithHelp>
                  Продажі <ChevronDown size={14} />
                  <HelpCircle size={14} style={{ color: '#9ca3af' }} />
                </ThWithHelp>
                <ThWithHelp>
                  Виручка
                  <HelpCircle size={14} style={{ color: '#9ca3af' }} />
                </ThWithHelp>
                <ThWithHelp>
                  Продано
                  <HelpCircle size={14} style={{ color: '#9ca3af' }} />
                </ThWithHelp>
                <ThWithHelp>
                  Прибуток
                  <HelpCircle size={14} style={{ color: '#9ca3af' }} />
                </ThWithHelp>
                <Th>Маржинальність</Th>
              </tr>
            </Thead>
            <tbody>
              {categorySummaries.map((summary, idx) => (
                idx === 0 ? (
                  <TotalRow key={summary.name}>
                    <Td></Td>
                    <Td>{summary.name}</Td>
                    <Td>{summary.count}</Td>
                    <Td>{formatPrice(summary.revenue)}</Td>
                    <Td>{summary.sold}</Td>
                    <Td>{formatPrice(summary.profit)}</Td>
                    <Td>{summary.marginality}%</Td>
                  </TotalRow>
                ) : (
                  <>
                    <Tr key={summary.name} onClick={() => toggleCategory(summary.name)}>
                      <ExpandCell>
                        <ExpandButton>
                          {expandedCategories.has(summary.name) ? (
                            <Minus size={16} />
                          ) : (
                            <Plus size={16} />
                          )}
                        </ExpandButton>
                      </ExpandCell>
                      <Td>
                        <CategoryName>⊙ {summary.name}</CategoryName>
                      </Td>
                      <Td>
                        <CountLink>{summary.count}</CountLink>
                      </Td>
                      <Td>{formatPrice(summary.revenue)}</Td>
                      <Td>{summary.sold}</Td>
                      <Td>{formatPrice(summary.profit)}</Td>
                      <Td>{summary.marginality}%</Td>
                    </Tr>
                    {expandedCategories.has(summary.name) && 
                      getCategoryProducts(summary.name).slice(0, 10).map(product => (
                        <Tr key={product._id} level={1} onClick={() => openProductPanel(product)}>
                          <Td></Td>
                          <CategoryCell level={1}>
                            <CategoryName>{product.name}</CategoryName>
                          </CategoryCell>
                          <Td>0</Td>
                          <Td>0,00</Td>
                          <Td>0</Td>
                          <Td>0,00</Td>
                          <Td>—</Td>
                        </Tr>
                      ))
                    }
                  </>
                )
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </PageContainer>

      {/* Overlay */}
      <PanelOverlay isOpen={selectedProduct !== null} onClick={closePanel} />

      {/* Product Detail Panel */}
      <SlidePanel isOpen={selectedProduct !== null}>
        {selectedProduct && (
          <>
            <PanelHeader>
              <PanelCloseButton onClick={closePanel}>
                <X size={20} />
              </PanelCloseButton>
              <PanelActions>
                <EditButton>Редагувати</EditButton>
                <span style={{ padding: 8 }}>
                  <Download size={18} color={theme.colors.textMuted} />
                </span>
                <DeleteButton>Видалити</DeleteButton>
              </PanelActions>
            </PanelHeader>
            <PanelContent>
              {selectedProduct.image && (
                <ProductImage src={selectedProduct.image} alt={selectedProduct.name} />
              )}
              <PanelLabel>товар</PanelLabel>
              <PanelTitle>{selectedProduct.name}</PanelTitle>
              
              <InfoGrid>
                <InfoLabel>Штрих-код:</InfoLabel>
                <InfoValue>{selectedProduct.barcode || '—'}</InfoValue>
                <InfoLabel>Артикул:</InfoLabel>
                <InfoValue>{selectedProduct.article || selectedProduct._id?.slice(-6) || '—'}</InfoValue>
                <InfoLabel>Код товару:</InfoLabel>
                <InfoValue>{selectedProduct.code || '—'}</InfoValue>
              </InfoGrid>

              <div style={{ marginTop: 24 }}>
                <TabsContainer>
                  <Tab active>Інформація</Tab>
                  <Tab>Історія руху</Tab>
                </TabsContainer>

                <InfoGrid style={{ marginTop: 16 }}>
                  <InfoLabel>Створено</InfoLabel>
                  <InfoValue>
                    {selectedProduct.created 
                      ? format(new Date(selectedProduct.created * 1000), 'd MMMM yyyy', { locale: ru })
                      : '—'
                    }
                  </InfoValue>
                  <InfoLabel>Категорії</InfoLabel>
                  <InfoValue>{selectedProduct.categories?.[0]?.name || '—'}</InfoValue>
                  <InfoLabel>Країна</InfoLabel>
                  <InfoValue>—</InfoValue>
                  <InfoLabel>Срок придатності</InfoLabel>
                  <InfoValue>—</InfoValue>
                  <InfoLabel>Група</InfoLabel>
                  <InfoValue>Товари і послуги</InfoValue>
                  <InfoLabel>Опис</InfoLabel>
                  <InfoValue>—</InfoValue>
                </InfoGrid>
              </div>

              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>ЦІНИ</h4>
                <Table style={{ minWidth: 'auto' }}>
                  <thead>
                    <tr>
                      <Th style={{ padding: '8px 12px' }}>Ціна продажу</Th>
                      <Th style={{ padding: '8px 12px' }}>Ціна закупки</Th>
                      <Th style={{ padding: '8px 12px' }}>Собівартість</Th>
                      <Th style={{ padding: '8px 12px' }}>Націнка</Th>
                      <Th style={{ padding: '8px 12px' }}>Маржинальність</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <Td style={{ padding: '8px 12px', color: theme.colors.danger }}>
                        {formatPrice(selectedProduct.price || 0)} грн
                      </Td>
                      <Td style={{ padding: '8px 12px' }}>
                        {formatPrice(selectedProduct.cost * 1.05 || 0)} грн
                      </Td>
                      <Td style={{ padding: '8px 12px' }}>
                        {formatPrice(selectedProduct.cost || 0)} грн
                      </Td>
                      <Td style={{ padding: '8px 12px' }}>
                        {selectedProduct.cost ? Math.round(((selectedProduct.price || 0) / selectedProduct.cost - 1) * 100) : 0}%
                      </Td>
                      <Td style={{ padding: '8px 12px' }}>
                        {selectedProduct.price ? Math.round(((selectedProduct.price - (selectedProduct.cost || 0)) / selectedProduct.price) * 100) : 0}%
                      </Td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            </PanelContent>
          </>
        )}
      </SlidePanel>
    </MainLayout>
  );
}
