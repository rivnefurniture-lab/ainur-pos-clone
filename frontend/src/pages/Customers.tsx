import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  Info,
  Download,
  Upload,
  X,
  Settings,
  Check,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchCustomers } from '../store/slices/dataSlice';
import { documentApi } from '../services/api';
import type { Customer, Document } from '../types';
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

const ActionButton = styled.button`
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

const LoyaltyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid ${theme.colors.primary};
  border-radius: 4px;
  font-size: 14px;
  color: ${theme.colors.primary};

  &:hover {
    background: #f0f7ff;
  }
`;

const ImportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fb923c;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  color: white;

  &:hover {
    background: #f97316;
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
  min-width: 1200px;
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
`;

const CustomerLink = styled.span`
  color: ${theme.colors.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover {
    text-decoration: underline;
  }
`;

const GenderIcon = styled.span<{ male?: boolean }>`
  display: inline-flex;
  align-items: center;
  color: ${props => props.male ? '#3b82f6' : '#ec4899'};
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

const CustomerAvatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
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

const ContactInfo = styled.div`
  margin-bottom: 24px;
`;

const ContactLink = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${theme.colors.primary};
  font-size: 14px;
  margin-bottom: 8px;
  &:hover {
    text-decoration: underline;
  }
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

const StatValue = styled.div<{ color?: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color || theme.colors.textPrimary};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
`;

const BadgeContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const Badge = styled.span<{ color?: string; bg?: string }>`
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  background: ${props => props.bg || theme.colors.successLight};
  color: ${props => props.color || theme.colors.success};
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

const OperationCard = styled.div<{ borderColor?: string }>`
  background: white;
  border: 1px solid ${props => props.borderColor || theme.colors.border};
  border-left: 4px solid ${props => props.borderColor || theme.colors.success};
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
  color: ${theme.colors.success};
  font-weight: 500;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const OperationAmount = styled.div`
  font-weight: 600;
  color: ${theme.colors.textPrimary};
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

const PaymentStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${theme.colors.success};
  margin-top: 8px;
`;

// ============================================
// Component
// ============================================
export default function Customers() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { customers, customersTotal } = useAppSelector(state => state.data);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [panelTab, setPanelTab] = useState<'sales' | 'money'>('sales');
  const [customerDocs, setCustomerDocs] = useState<Document[]>([]);
  const itemsPerPage = 20;

  useEffect(() => {
    if (user) {
      dispatch(fetchCustomers({ companyId: user._client }));
    }
  }, [dispatch, user]);

  // Load customer documents when panel opens
  useEffect(() => {
    const loadCustomerDocs = async () => {
      if (selectedCustomer && user) {
        try {
          const response = await documentApi.searchDocuments(
            user._client,
            { types: ['sales'] },
            0,
            100
          );
          if (response.status && response.data) {
            const docs = response.data.filter(d => 
              d._customer === selectedCustomer._id || 
              d.customer_name === selectedCustomer.name
            );
            setCustomerDocs(docs);
          }
        } catch (e) {
          console.error('Failed to load customer docs:', e);
        }
      }
    };
    loadCustomerDocs();
  }, [selectedCustomer, user]);

  const filteredCustomers = customers.filter(c => {
    if (c.deleted) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(query) ||
           c.phones?.some(p => p.includes(query)) ||
           c.emails?.some(e => e.toLowerCase().includes(query)) ||
           c.discount_card?.toLowerCase().includes(query);
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
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

  const formatBirthday = (bday: string | undefined) => {
    if (!bday) return '';
    try {
      return bday;
    } catch {
      return '';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const openCustomerPanel = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPanelTab('sales');
  };

  const closePanel = () => {
    setSelectedCustomer(null);
  };

  // Group documents by date
  const groupedDocs = customerDocs.reduce((groups, doc) => {
    const date = format(new Date((doc.date || 0) * 1000), 'd MMMM', { locale: ru });
    if (!groups[date]) groups[date] = [];
    groups[date].push(doc);
    return groups;
  }, {} as Record<string, Document[]>);

  return (
    <MainLayout title="Клієнти">
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
          <ActionButton>
            <Info size={16} />
            Інформація
          </ActionButton>
          <LoyaltyButton>
            <Settings size={16} />
            Налаштування системи лояльності
          </LoyaltyButton>
          <TotalCount>Ітого {customersTotal || filteredCustomers.length}</TotalCount>
          <ImportButton>
            <Upload size={16} />
            Імпорт клієнтів
          </ImportButton>
          <ExportButton>
            <Download size={16} />
            Скачати в Excel
          </ExportButton>
        </TopBar>

        <TableContainer>
          <Table>
            <Thead>
              <tr>
                <Th>КЛІЄНТ</Th>
                <Th>ТЕЛЕФОН</Th>
                <Th>EMAIL</Th>
                <Th>ДЕНЬ НАРОДЖЕННЯ</Th>
                <Th>СТАТЬ</Th>
                <Th>ОПИС</Th>
                <Th>АДРЕСА</Th>
                <Th>ДОДАВ</Th>
              </tr>
            </Thead>
            <tbody>
              {paginatedCustomers.map(customer => (
                <Tr key={customer._id} onClick={() => openCustomerPanel(customer)}>
                  <Td>
                    <CustomerLink>
                      <GenderIcon male={customer.sex === 'male'}>
                        {customer.sex === 'male' ? '♂' : customer.sex === 'female' ? '♀' : ''}
                      </GenderIcon>
                      {customer.name}
                    </CustomerLink>
                  </Td>
                  <Td>{customer.phones?.[0] || ''}</Td>
                  <Td>{customer.emails?.[0] || ''}</Td>
                  <Td>{formatBirthday(customer.bday)}</Td>
                  <Td>{customer.sex === 'male' ? 'Чоловіча' : customer.sex === 'female' ? 'Жіноча' : ''}</Td>
                  <Td>{customer.description || ''}</Td>
                  <Td>{customer.address?.actual || ''}</Td>
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
      <PanelOverlay isOpen={selectedCustomer !== null} onClick={closePanel} />

      {/* Customer Detail Panel */}
      <SlidePanel isOpen={selectedCustomer !== null}>
        {selectedCustomer && (
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
              <CustomerAvatar>{getInitials(selectedCustomer.name)}</CustomerAvatar>
              <PanelTitle>{selectedCustomer.name}</PanelTitle>
              <PanelSubtitle>
                Створено {selectedCustomer.created ? formatDate(selectedCustomer.created) : '—'}
              </PanelSubtitle>
              <PanelLabel style={{ textAlign: 'right' }}>
                {selectedCustomer.type === 'company' ? 'Компанія' : 'Клієнт'}
              </PanelLabel>

              <ContactInfo>
                {selectedCustomer.phones?.[0] && (
                  <ContactLink href={`tel:${selectedCustomer.phones[0]}`}>
                    <Phone size={16} />
                    {selectedCustomer.phones[0]}
                  </ContactLink>
                )}
                {selectedCustomer.emails?.[0] && (
                  <ContactLink href={`mailto:${selectedCustomer.emails[0]}`}>
                    <Mail size={16} />
                    {selectedCustomer.emails[0]}
                  </ContactLink>
                )}
              </ContactInfo>

              <BadgeContainer>
                {selectedCustomer.discount > 0 && (
                  <Badge>Знижка {selectedCustomer.discount}%</Badge>
                )}
                {selectedCustomer.bonus_balance > 0 && (
                  <Badge color={theme.colors.warning} bg={theme.colors.warningLight}>
                    {selectedCustomer.bonus_balance} бонусів
                  </Badge>
                )}
              </BadgeContainer>

              <StatSection>
                <StatTitle>СТАТИСТИКА</StatTitle>
                <StatGrid>
                  <StatItem>
                    <StatLabel>Кількість покупок</StatLabel>
                    <StatValue>{customerDocs.length}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Сума покупок</StatLabel>
                    <StatValue>{formatPrice(customerDocs.reduce((s, d) => s + (d.total || 0), 0))} грн</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Борг</StatLabel>
                    <StatValue color={selectedCustomer.debt > 0 ? theme.colors.danger : undefined}>
                      {formatPrice(selectedCustomer.debt || 0)} грн
                    </StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Середній чек</StatLabel>
                    <StatValue>
                      {customerDocs.length > 0 
                        ? formatPrice(customerDocs.reduce((s, d) => s + (d.total || 0), 0) / customerDocs.length)
                        : '0,00'
                      } грн
                    </StatValue>
                  </StatItem>
                </StatGrid>
              </StatSection>

              <StatTitle>ОСТАННІ ОПЕРАЦІЇ</StatTitle>
              <TabsContainer>
                <Tab active={panelTab === 'sales'} onClick={() => setPanelTab('sales')}>
                  Продажі
                </Tab>
                <Tab active={panelTab === 'money'} onClick={() => setPanelTab('money')}>
                  Рух грошей
                </Tab>
              </TabsContainer>

              {Object.entries(groupedDocs).map(([date, docs]) => (
                <DateGroup key={date}>
                  <DateGroupTitle>{date}</DateGroupTitle>
                  {docs.map(doc => (
                    <OperationCard key={doc._id} borderColor={theme.colors.success}>
                      <OperationHeader>
                        <OperationTitle>
                          Продаж #{doc.number}
                        </OperationTitle>
                        <OperationAmount>
                          {formatPrice(doc.total || 0)} грн
                        </OperationAmount>
                      </OperationHeader>
                      <OperationMeta>
                        Магазин {doc.store_name || '—'} • клієнт {selectedCustomer.name}
                      </OperationMeta>
                      <OperationMeta style={{ marginTop: 4 }}>
                        {doc.author_name || 'Олег Кицюк'} {doc.date ? format(new Date(doc.date * 1000), 'd MMMM HH:mm', { locale: ru }) : ''}
                      </OperationMeta>
                      <PaymentStatus>
                        <Check size={14} />
                        Документ оплачен
                      </PaymentStatus>
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
