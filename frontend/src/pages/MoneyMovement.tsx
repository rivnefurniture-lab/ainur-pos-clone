import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Search,
  Check,
  X,
  Filter,
  ChevronDown,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppSelector } from '../hooks/useRedux';
import { documentApi } from '../services/api';
import { theme } from '../styles/GlobalStyles';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MoneyTransaction {
  _id: string;
  number: number;
  type: 'income' | 'expense';
  date: number;
  amount: number;
  counterparty?: string;
  counterparty_name?: string;
  account_name?: string;
  category_name?: string;
  author_name?: string;
  description?: string;
  status?: string;
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

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  flex-wrap: wrap;
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  min-width: 240px;

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

const FilterDropdown = styled.div`
  position: relative;
`;

const FilterButton = styled.button<{ hasValue?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  min-width: 100px;
  
  span {
    color: ${props => props.hasValue ? theme.colors.textPrimary : theme.colors.textSecondary};
  }
`;

const FilterMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  box-shadow: ${theme.shadows.md};
  min-width: 180px;
  z-index: 20;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const FilterOption = styled.div`
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background: #f5f5f5;
  }
`;

const ClearFilter = styled.button`
  margin-left: 4px;
  color: ${theme.colors.textMuted};
  padding: 4px;
  &:hover {
    color: ${theme.colors.textPrimary};
  }
`;

const ExtraFilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  
  svg {
    color: ${theme.colors.textMuted};
  }

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

const DateGroupRow = styled.tr`
  background: #f9fafb;
`;

const DateGroupCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.textPrimary};
  border-bottom: 1px solid ${theme.colors.border};
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

const StatusIcon = styled.span`
  display: inline-flex;
  color: ${theme.colors.success};
`;

const TransactionLink = styled.span<{ type?: 'income' | 'expense' }>`
  color: ${props => props.type === 'expense' ? theme.colors.danger : theme.colors.success};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const CounterpartyLink = styled.span`
  color: ${theme.colors.primary};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const AmountCell = styled.td<{ type?: 'income' | 'expense' }>`
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.type === 'expense' ? theme.colors.danger : theme.colors.success};
  border-bottom: 1px solid ${theme.colors.border};
  vertical-align: middle;
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

const TransactionCard = styled.div<{ type?: 'income' | 'expense' }>`
  background: ${props => props.type === 'expense' ? '#fef2f2' : '#f0fdf4'};
  border: 1px solid ${props => props.type === 'expense' ? '#fecaca' : '#bbf7d0'};
  border-left: 4px solid ${props => props.type === 'expense' ? theme.colors.danger : theme.colors.success};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const TransactionTitle = styled.div<{ type?: 'income' | 'expense' }>`
  color: ${props => props.type === 'expense' ? theme.colors.danger : theme.colors.success};
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const TransactionAmount = styled.div<{ type?: 'income' | 'expense' }>`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.type === 'expense' ? theme.colors.danger : theme.colors.success};
  margin-bottom: 16px;
`;

const TransactionMeta = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const MetaLabel = styled.span`
  color: ${theme.colors.textSecondary};
`;

const MetaLink = styled.span`
  color: ${theme.colors.primary};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const TagsList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const Tag = styled.span`
  padding: 4px 10px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 12px;
  color: ${theme.colors.textSecondary};
`;

const TimelineItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px 0;
`;

const TimelineDot = styled.div<{ color?: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.color || theme.colors.primary};
  margin-top: 4px;
`;

const TimelineContent = styled.div`
  flex: 1;
`;

const TimelineLabel = styled.div`
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  margin-bottom: 2px;
`;

const TimelineTime = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
`;

// ============================================
// Component
// ============================================
export default function MoneyMovement() {
  const { user } = useAppSelector(state => state.auth);
  const { accounts } = useAppSelector(state => state.data);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<MoneyTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<MoneyTransaction | null>(null);

  // Generate mock transactions from documents
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user) return;
      
      try {
        const response = await documentApi.searchDocuments(
          user._client,
          {},
          0,
          200
        );
        
        if (response.status && response.data) {
          // Convert documents to money transactions
          const txns: MoneyTransaction[] = response.data
            .filter(doc => doc.type === 'sales' || doc.type === 'purchases')
            .map((doc, idx) => ({
              _id: doc._id,
              number: 306500 + idx,
              type: doc.type === 'sales' ? 'income' as const : 'expense' as const,
              date: doc.date || 0,
              amount: doc.total || 0,
              counterparty: doc._customer,
              counterparty_name: doc.type === 'sales' ? 'Роздріб Інстаграм' : doc.customer_name,
              account_name: 'Офіс "LOVEISKA"',
              category_name: 'Оплата від клієнта',
              author_name: doc.author_name || 'Олег Кицюк',
              status: 'completed',
            }));
          setTransactions(txns);
        }
      } catch (e) {
        console.error('Failed to load transactions:', e);
      }
    };
    
    loadTransactions();
  }, [user]);

  const formatPrice = (price: number) => {
    const parts = (price || 0).toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',');
  };

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'HH:mm');
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const txnDate = new Date(txn.date * 1000);
    if (txnDate < dateFrom || txnDate > dateTo) return false;
    if (typeFilter && txn.type !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!txn.counterparty_name?.toLowerCase().includes(query) &&
          !String(txn.number).includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Group by date
  const groupedTransactions = filteredTransactions.reduce((groups, txn) => {
    const date = format(new Date(txn.date * 1000), 'd MMMM', { locale: ru });
    if (!groups[date]) groups[date] = [];
    groups[date].push(txn);
    return groups;
  }, {} as Record<string, MoneyTransaction[]>);

  const openTransactionPanel = (txn: MoneyTransaction) => {
    setSelectedTransaction(txn);
  };

  const closePanel = () => {
    setSelectedTransaction(null);
  };

  const statusOptions = [
    { value: 'completed', label: 'Документ проведен' },
    { value: 'pending', label: 'Документ не проведен' },
    { value: 'deleted', label: 'Видалений' },
  ];

  const typeOptions = [
    { value: 'expense', label: 'Расход' },
    { value: 'income', label: 'Приход' },
  ];

  return (
    <MainLayout title="Рух грошей">
      <PageContainer>
        <TopBar>
          <SearchInput>
            <Search size={16} color="#9ca3af" />
            <input
              placeholder="пошук по номеру або коментарю"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInput>

          <FilterDropdown>
            <FilterButton hasValue onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}>
              Дата
              <span>{format(dateFrom, 'd MMM', { locale: ru })} — {format(dateTo, 'd MMM', { locale: ru })}</span>
              <ClearFilter onClick={(e) => {
                e.stopPropagation();
                setDateFrom(subDays(new Date(), 7));
                setDateTo(new Date());
              }}>
                <X size={14} />
              </ClearFilter>
            </FilterButton>
          </FilterDropdown>

          <FilterDropdown>
            <FilterButton onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}>
              статус
              <span>{statusFilter ? statusOptions.find(o => o.value === statusFilter)?.label : 'Виберіть'}</span>
              {statusFilter && (
                <ClearFilter onClick={(e) => { e.stopPropagation(); setStatusFilter(''); }}>
                  <X size={14} />
                </ClearFilter>
              )}
            </FilterButton>
            <FilterMenu isOpen={openDropdown === 'status'}>
              {statusOptions.map(opt => (
                <FilterOption key={opt.value} onClick={() => { setStatusFilter(opt.value); setOpenDropdown(null); }}>
                  {opt.label}
                </FilterOption>
              ))}
            </FilterMenu>
          </FilterDropdown>

          <FilterDropdown>
            <FilterButton onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}>
              тип
              <span>{typeFilter ? typeOptions.find(o => o.value === typeFilter)?.label : 'Виберіть'}</span>
              {typeFilter && (
                <ClearFilter onClick={(e) => { e.stopPropagation(); setTypeFilter(''); }}>
                  <X size={14} />
                </ClearFilter>
              )}
            </FilterButton>
            <FilterMenu isOpen={openDropdown === 'type'}>
              {typeOptions.map(opt => (
                <FilterOption key={opt.value} onClick={() => { setTypeFilter(opt.value); setOpenDropdown(null); }}>
                  {opt.label}
                </FilterOption>
              ))}
            </FilterMenu>
          </FilterDropdown>

          <ExtraFilterButton>
            <Filter size={16} />
            Фільтр
          </ExtraFilterButton>
        </TopBar>

        <TableContainer>
          <Table>
            <Thead>
              <tr>
                <Th>СТАТУС</Th>
                <Th>ЗАКАЗ</Th>
                <Th>ВРЕМЯ</Th>
                <Th>ПРИХОД, ГРН</Th>
                <Th>РАСХОД, ГРН</Th>
                <Th>КОНТРАГЕНТ</Th>
                <Th>СЧЁТ</Th>
                <Th>КАТЕГОРІЯ ПЛАТЕЖУ</Th>
                <Th>АВТОР</Th>
              </tr>
            </Thead>
            <tbody>
              {Object.entries(groupedTransactions).map(([date, txns]) => (
                <>
                  <DateGroupRow key={`date-${date}`}>
                    <DateGroupCell colSpan={9}>{date}</DateGroupCell>
                  </DateGroupRow>
                  {txns.map(txn => (
                    <Tr key={txn._id} onClick={() => openTransactionPanel(txn)}>
                      <Td>
                        <StatusIcon>
                          <Check size={18} />
                        </StatusIcon>
                      </Td>
                      <Td>
                        <TransactionLink type={txn.type}>
                          {txn.type === 'income' ? 'Прихід' : 'Расход'} #{txn.number}
                        </TransactionLink>
                      </Td>
                      <Td>{formatTime(txn.date)}</Td>
                      <AmountCell type={txn.type === 'income' ? 'income' : undefined}>
                        {txn.type === 'income' ? formatPrice(txn.amount) : ''}
                      </AmountCell>
                      <AmountCell type={txn.type === 'expense' ? 'expense' : undefined}>
                        {txn.type === 'expense' ? formatPrice(txn.amount) : ''}
                      </AmountCell>
                      <Td>
                        <CounterpartyLink>{txn.counterparty_name || '—'}</CounterpartyLink>
                      </Td>
                      <Td>{txn.account_name}</Td>
                      <Td>{txn.category_name}</Td>
                      <Td>
                        <CounterpartyLink>{txn.author_name}</CounterpartyLink>
                      </Td>
                    </Tr>
                  ))}
                </>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </PageContainer>

      {/* Overlay */}
      <PanelOverlay isOpen={selectedTransaction !== null} onClick={closePanel} />

      {/* Transaction Detail Panel */}
      <SlidePanel isOpen={selectedTransaction !== null}>
        {selectedTransaction && (
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
              <TransactionCard type={selectedTransaction.type}>
                <TransactionTitle type={selectedTransaction.type}>
                  {selectedTransaction.type === 'income' ? 'Прихід' : 'Расход'} #{selectedTransaction.number}
                </TransactionTitle>
                <TransactionAmount type={selectedTransaction.type}>
                  {selectedTransaction.type === 'expense' ? '-' : '+'}
                  {formatPrice(selectedTransaction.amount)} грн
                </TransactionAmount>
                <TransactionMeta>
                  <MetaLabel>Контрагент: </MetaLabel>
                  <MetaLink>{selectedTransaction.counterparty_name || '—'}</MetaLink>
                </TransactionMeta>
                <TransactionMeta>
                  <MetaLabel>Счёт: </MetaLabel>
                  {selectedTransaction.account_name}
                </TransactionMeta>
                <TagsList>
                  <Tag>{selectedTransaction.category_name}</Tag>
                </TagsList>
              </TransactionCard>

              <TimelineItem>
                <TimelineDot color={theme.colors.primary} />
                <TimelineContent>
                  <TimelineLabel>Переказ грошей</TimelineLabel>
                </TimelineContent>
              </TimelineItem>
              <TimelineItem>
                <TimelineDot color={theme.colors.gray300} />
                <TimelineContent>
                  <TimelineLabel>службове винесення</TimelineLabel>
                  <TimelineTime>
                    {format(new Date(selectedTransaction.date * 1000), 'd MMMM HH:mm', { locale: ru })}
                  </TimelineTime>
                </TimelineContent>
              </TimelineItem>
            </PanelContent>
          </>
        )}
      </SlidePanel>
    </MainLayout>
  );
}
