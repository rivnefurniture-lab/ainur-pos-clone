import { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { 
  Truck, 
  Plus, 
  Phone, 
  Mail, 
  Search, 
  Info, 
  Download,
  X,
  Check,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchSuppliers } from '../store/slices/dataSlice';
import { documentApi } from '../services/api';
import type { Supplier, Document } from '../types';
import { theme } from '../styles/GlobalStyles';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ============================================
// Styled Components
// ============================================
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  overflow: hidden;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  flex-wrap: wrap;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${theme.colors.primary};
  color: white;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: ${theme.colors.primaryHover};
  }
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  min-width: 200px;

  input {
    border: none;
    outline: none;
    font-size: 14px;
    width: 100%;
    &::placeholder {
      color: #9ca3af;
    }
  }
`;

const InfoButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};

  &:hover {
    background: #f5f5f5;
  }
`;

const TotalCount = styled.div`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  margin-left: auto;
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};

  &:hover {
    background: #f5f5f5;
  }
`;

const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
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
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${theme.colors.textSecondary};
  border-bottom: 1px solid ${theme.colors.border};
  white-space: nowrap;

  &:first-child {
    padding-left: 16px;
  }
`;

const Tr = styled.tr`
  cursor: pointer;
  &:hover {
    background: #f9fafb;
  }
`;

const Td = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  border-bottom: 1px solid ${theme.colors.border};
  vertical-align: middle;

  &:first-child {
    padding-left: 16px;
  }
`;

const SupplierLink = styled.span`
  color: ${theme.colors.primary};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid ${theme.colors.border};
  background: white;
  gap: 8px;
`;

const PageLabel = styled.span`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
`;

const PageButton = styled.button<{ active?: boolean }>`
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 14px;
  background: ${props => props.active ? theme.colors.primary : 'white'};
  color: ${props => props.active ? 'white' : theme.colors.textPrimary};
  border: 1px solid ${props => props.active ? theme.colors.primary : theme.colors.border};

  &:hover:not(:disabled) {
    background: ${props => props.active ? theme.colors.primaryHover : '#f5f5f5'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const PanelTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
`;

const PanelSubtitle = styled.div`
  font-size: 13px;
  color: ${theme.colors.textMuted};
  margin-bottom: 24px;
`;

const PanelLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const StatSection = styled.div`
  margin-bottom: 24px;
`;

const StatTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${theme.colors.textSecondary};
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const StatItem = styled.div``;

const StatValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
`;

const BalanceValue = styled.div<{ positive?: boolean }>`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.positive ? theme.colors.success : theme.colors.textPrimary};
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin: 24px 0 16px;
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  background: ${props => props.active ? '#f0f7ff' : 'white'};
  border: 1px solid ${props => props.active ? theme.colors.primary : theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  color: ${props => props.active ? theme.colors.primary : theme.colors.textPrimary};
  cursor: pointer;

  &:hover {
    background: ${props => props.active ? '#f0f7ff' : '#f5f5f5'};
  }
`;

const OperationCard = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const OperationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const OperationTitle = styled.div`
  color: ${theme.colors.primary};
  font-weight: 500;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const OperationAmount = styled.div<{ type?: 'income' | 'expense' }>`
  font-weight: 600;
  color: ${props => props.type === 'income' ? theme.colors.success : props.type === 'expense' ? theme.colors.danger : theme.colors.textPrimary};
`;

const OperationMeta = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

const DateGroup = styled.div`
  margin-bottom: 16px;
`;

const DateGroupTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.textPrimary};
  margin-bottom: 12px;
`;

// ============================================
// Component
// ============================================
export default function Suppliers() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { suppliers } = useAppSelector(state => state.data);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [panelTab, setPanelTab] = useState<'movement' | 'money'>('movement');
  const [supplierDocs, setSupplierDocs] = useState<Document[]>([]);
  const itemsPerPage = 20;

  useEffect(() => {
    if (user) {
      dispatch(fetchSuppliers(user._client));
    }
  }, [dispatch, user]);

  // Load supplier documents when panel opens
  useEffect(() => {
    const loadSupplierDocs = async () => {
      if (selectedSupplier && user) {
        try {
          const response = await documentApi.searchDocuments(
            user._client,
            { types: ['purchases'] },
            0,
            100
          );
          if (response.status && response.data) {
            // Filter for this supplier
            const docs = response.data.filter(d => 
              d._customer === selectedSupplier._id || 
              d.customer_name === selectedSupplier.name
            );
            setSupplierDocs(docs);
          }
        } catch (e) {
          console.error('Failed to load supplier docs:', e);
        }
      }
    };
    loadSupplierDocs();
  }, [selectedSupplier, user]);

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(query) ||
           s.description?.toLowerCase().includes(query) ||
           s.phones?.some(p => p.includes(query)) ||
           s.emails?.some(e => e.toLowerCase().includes(query));
  });

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatPrice = (price: number) => {
    const parts = (price || 0).toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',');
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'd MMMM yyyy', { locale: ru });
  };

  const openSupplierPanel = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setPanelTab('movement');
  };

  const closePanel = () => {
    setSelectedSupplier(null);
  };

  // Group documents by date
  const groupedDocs = supplierDocs.reduce((groups, doc) => {
    const date = format(new Date((doc.date || 0) * 1000), 'd MMMM', { locale: ru });
    if (!groups[date]) groups[date] = [];
    groups[date].push(doc);
    return groups;
  }, {} as Record<string, Document[]>);

  return (
    <MainLayout title="Постачальники">
      <PageContainer>
        <TopBar>
          <CreateButton>
            <Plus size={18} />
            Створити
          </CreateButton>
          <SearchInput>
            <Search size={16} color="#9ca3af" />
            <input
              placeholder="пошук"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInput>
          <InfoButton>
            <Info size={16} />
            Інформація
          </InfoButton>
          <TotalCount>Ітого {filteredSuppliers.length}</TotalCount>
          <ExportButton>
            <Download size={16} />
            Скачати в Excel
          </ExportButton>
        </TopBar>

        <TableContainer>
          <Table>
            <Thead>
              <tr>
                <Th>ПОСТАЧАЛЬНИК</Th>
                <Th>ТЕЛЕФОН</Th>
                <Th>EMAIL</Th>
                <Th>ОПИС</Th>
                <Th>АДРЕСА</Th>
                <Th>ДОДАВ</Th>
              </tr>
            </Thead>
            <tbody>
              {paginatedSuppliers.map(supplier => (
                <Tr key={supplier._id} onClick={() => openSupplierPanel(supplier)}>
                  <Td>
                    <SupplierLink>{supplier.name}</SupplierLink>
                  </Td>
                  <Td>{supplier.phones?.[0] || ''}</Td>
                  <Td>{supplier.emails?.[0] || ''}</Td>
                  <Td>{supplier.description || ''}</Td>
                  <Td>{supplier.address?.street || ''}</Td>
                  <Td>Олег Кицюк</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>

        <Pagination>
          <PageLabel>Сторінки</PageLabel>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1).map(pageNum => (
            <PageButton
              key={pageNum}
              active={pageNum === currentPage}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </PageButton>
          ))}
          {totalPages > 7 && (
            <>
              <span>...</span>
              <PageButton onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </PageButton>
            </>
          )}
        </Pagination>
      </PageContainer>

      {/* Overlay */}
      <PanelOverlay isOpen={selectedSupplier !== null} onClick={closePanel} />

      {/* Supplier Detail Panel */}
      <SlidePanel isOpen={selectedSupplier !== null}>
        {selectedSupplier && (
          <>
            <PanelHeader>
              <PanelCloseButton onClick={closePanel}>
                <X size={20} />
              </PanelCloseButton>
              <PanelActions>
                <EditButton>Редагувати</EditButton>
                <DeleteButton>Видалити</DeleteButton>
              </PanelActions>
            </PanelHeader>
            <PanelContent>
              <PanelTitle>{selectedSupplier.name}</PanelTitle>
              <PanelSubtitle>
                Створено {selectedSupplier.created ? formatDate(selectedSupplier.created) : '—'}
              </PanelSubtitle>
              <PanelLabel style={{ textAlign: 'right' }}>Постачальник</PanelLabel>

              <StatSection>
                <StatTitle>СТАТИСТИКА</StatTitle>
                <StatGrid>
                  <StatItem>
                    <StatLabel>Борг по закупкам</StatLabel>
                    <StatValue>{formatPrice(selectedSupplier.debt || 0)}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Борг по возвратам</StatLabel>
                    <StatValue>{formatPrice(selectedSupplier.rdebt || 0)}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Кількість закупок</StatLabel>
                    <StatValue>{supplierDocs.filter(d => d.type === 'purchases').length}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Кількість возвратів закупок</StatLabel>
                    <StatValue>0</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Сума закупок</StatLabel>
                    <StatValue>{formatPrice(supplierDocs.reduce((s, d) => s + (d.total || 0), 0))}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Сума возвратів закупок</StatLabel>
                    <StatValue>0</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Сума расходов</StatLabel>
                    <StatValue>{formatPrice(0)}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Сума приходов</StatLabel>
                    <StatValue>0,00</StatValue>
                  </StatItem>
                </StatGrid>
                <div style={{ marginTop: 16 }}>
                  <StatLabel>Баланс</StatLabel>
                  <BalanceValue positive={(selectedSupplier.rdebt || 0) - (selectedSupplier.debt || 0) >= 0}>
                    {formatPrice((selectedSupplier.rdebt || 0) - (selectedSupplier.debt || 0))}
                  </BalanceValue>
                </div>
              </StatSection>

              <StatTitle>ОСТАННІ ОПЕРАЦІЇ</StatTitle>
              <TabsContainer>
                <Tab active={panelTab === 'movement'} onClick={() => setPanelTab('movement')}>
                  Рух товару
                </Tab>
                <Tab active={panelTab === 'money'} onClick={() => setPanelTab('money')}>
                  Рух грошей
                </Tab>
              </TabsContainer>

              {Object.entries(groupedDocs).map(([date, docs]) => (
                <DateGroup key={date}>
                  <DateGroupTitle>{date}</DateGroupTitle>
                  {docs.map(doc => (
                    <OperationCard key={doc._id}>
                      <OperationHeader>
                        <OperationTitle>
                          Закупка #{doc.number}
                        </OperationTitle>
                        <OperationAmount type="expense">
                          {formatPrice(doc.total || 0)} грн
                        </OperationAmount>
                      </OperationHeader>
                      <OperationMeta>
                        Постачальник {selectedSupplier.name} → Магазин {doc.store_name || 'Офіс "LOVEISKA"'}
                      </OperationMeta>
                      <OperationMeta style={{ marginTop: 4 }}>
                        {doc.author_name || 'Олег Кицюк'} {doc.date ? format(new Date(doc.date * 1000), 'd MMMM HH:mm', { locale: ru }) : ''}
                      </OperationMeta>
                    </OperationCard>
                  ))}
                </DateGroup>
              ))}

              {Object.keys(groupedDocs).length === 0 && (
                <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                  Немає операцій
                </div>
              )}
            </PanelContent>
          </>
        )}
      </SlidePanel>
    </MainLayout>
  );
}
