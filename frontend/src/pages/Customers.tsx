import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  CreditCard,
  MoreVertical,
  UserPlus,
  Gift,
  TrendingUp,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchCustomers } from '../store/slices/dataSlice';
import type { Customer } from '../types';
import { theme } from '../styles/GlobalStyles';

// ============================================
// Styled Components (reusing from Products)
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
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatIcon = styled.div<{ color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color}15;
  color: ${props => props.color};
`;

const StatContent = styled.div``;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const CustomersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
`;

const CustomerCard = styled.div`
  background: ${theme.colors.white};
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  padding: 20px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: ${theme.colors.primary};
    box-shadow: ${theme.shadows.md};
  }
`;

const CustomerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const CustomerInfo = styled.div`
  display: flex;
  gap: 12px;
`;

const CustomerAvatar = styled.div<{ type: 'person' | 'company' }>`
  width: 48px;
  height: 48px;
  border-radius: ${props => props.type === 'company' ? '8px' : '50%'};
  background: ${props => props.type === 'company' ? theme.colors.infoLight : theme.colors.primaryLight};
  color: ${props => props.type === 'company' ? theme.colors.info : theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
`;

const CustomerDetails = styled.div``;

const CustomerName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin-bottom: 4px;
`;

const CustomerType = styled.span`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${theme.colors.gray100};
  color: ${theme.colors.textSecondary};
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

const CustomerContacts = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CustomerStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${theme.colors.border};
`;

const CustomerStat = styled.div`
  text-align: center;
`;

const CustomerStatValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const CustomerStatLabel = styled.div`
  font-size: 11px;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
`;

const DiscountBadge = styled.span`
  background: ${theme.colors.successLight};
  color: ${theme.colors.success};
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
`;

const BonusBadge = styled.span`
  background: ${theme.colors.warningLight};
  color: ${theme.colors.warning};
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
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
  grid-column: 1 / -1;
  padding: 60px 20px;
  text-align: center;
  color: ${theme.colors.textMuted};
  background: ${theme.colors.white};
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};

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

// ============================================
// Component
// ============================================

export default function Customers() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { customers, customersTotal } = useAppSelector(state => state.data);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  
  const itemsPerPage = 12;

  // Refresh data on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchCustomers({ companyId: user._client }));
    }
  }, [dispatch, user]);

  // Filter customers
  useEffect(() => {
    let result = customers.filter(c => !c.deleted);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.phones.some(p => p.includes(query)) ||
          c.discount_card?.toLowerCase().includes(query)
      );
    }

    if (typeFilter) {
      result = result.filter(c => c.type === typeFilter);
    }

    setFilteredCustomers(result);
    setCurrentPage(1);
  }, [customers, searchQuery, typeFilter]);

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const formatPrice = (price: number) => {
    return price.toFixed(2) + ' ₴';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate stats
  const totalDebt = customers.reduce((sum, c) => sum + (c.debt || 0), 0);
  const totalBonus = customers.reduce((sum, c) => sum + (c.bonus_balance || 0), 0);
  const withDiscount = customers.filter(c => c.discount > 0).length;

  return (
    <MainLayout title="Клієнти">
      <PageHeader>
        <PageTitle>База клієнтів</PageTitle>
        <HeaderActions>
          <ActionButton primary>
            <UserPlus size={18} />
            Додати клієнта
          </ActionButton>
        </HeaderActions>
      </PageHeader>

      <StatsBar>
        <StatCard>
          <StatIcon color={theme.colors.primary}>
            <Users size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{customersTotal}</StatValue>
            <StatLabel>Всього клієнтів</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon color={theme.colors.success}>
            <Gift size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{withDiscount}</StatValue>
            <StatLabel>Зі знижкою</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon color={theme.colors.warning}>
            <TrendingUp size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{formatPrice(totalBonus)}</StatValue>
            <StatLabel>Бонусів накопичено</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard>
          <StatIcon color={theme.colors.danger}>
            <CreditCard size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{formatPrice(totalDebt)}</StatValue>
            <StatLabel>Загальний борг</StatLabel>
          </StatContent>
        </StatCard>
      </StatsBar>

      <FiltersBar>
        <SearchInputWrapper>
          <Search size={18} />
          <input
            type="text"
            placeholder="Пошук за ім'ям, телефоном, карткою..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchInputWrapper>
        <FilterSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Всі типи</option>
          <option value="person">Фізичні особи</option>
          <option value="company">Компанії</option>
        </FilterSelect>
      </FiltersBar>

      <CustomersGrid>
        {paginatedCustomers.length > 0 ? (
          paginatedCustomers.map(customer => (
            <CustomerCard key={customer._id}>
              <CustomerHeader>
                <CustomerInfo>
                  <CustomerAvatar type={customer.type}>
                    {getInitials(customer.name)}
                  </CustomerAvatar>
                  <CustomerDetails>
                    <CustomerName>{customer.name}</CustomerName>
                    <CustomerType>
                      {customer.type === 'person' ? 'Фіз. особа' : 'Компанія'}
                    </CustomerType>
                  </CustomerDetails>
                </CustomerInfo>
                <ActionMenu>
                  <MoreVertical size={18} />
                </ActionMenu>
              </CustomerHeader>

              <CustomerContacts>
                {customer.phones[0] && (
                  <ContactItem>
                    <Phone />
                    {customer.phones[0]}
                  </ContactItem>
                )}
                {customer.emails[0] && (
                  <ContactItem>
                    <Mail />
                    {customer.emails[0]}
                  </ContactItem>
                )}
                {customer.discount_card && (
                  <ContactItem>
                    <CreditCard />
                    Картка: {customer.discount_card}
                  </ContactItem>
                )}
              </CustomerContacts>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {customer.discount > 0 && (
                  <DiscountBadge>Знижка {customer.discount}%</DiscountBadge>
                )}
                {customer.bonus_balance > 0 && (
                  <BonusBadge>{customer.bonus_balance.toFixed(0)} бонусів</BonusBadge>
                )}
              </div>

              <CustomerStats>
                <CustomerStat>
                  <CustomerStatValue>0</CustomerStatValue>
                  <CustomerStatLabel>Покупок</CustomerStatLabel>
                </CustomerStat>
                <CustomerStat>
                  <CustomerStatValue>{formatPrice(0)}</CustomerStatValue>
                  <CustomerStatLabel>Всього</CustomerStatLabel>
                </CustomerStat>
                <CustomerStat>
                  <CustomerStatValue style={{ color: customer.debt > 0 ? theme.colors.danger : 'inherit' }}>
                    {formatPrice(customer.debt)}
                  </CustomerStatValue>
                  <CustomerStatLabel>Борг</CustomerStatLabel>
                </CustomerStat>
              </CustomerStats>
            </CustomerCard>
          ))
        ) : (
          <EmptyState>
            <Users size={64} />
            <h3>Клієнтів не знайдено</h3>
            <p>Спробуйте змінити фільтри або додайте нового клієнта</p>
          </EmptyState>
        )}
      </CustomersGrid>

      {totalPages > 1 && (
        <Pagination>
          <PageButton
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            ←
          </PageButton>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
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
        </Pagination>
      )}
    </MainLayout>
  );
}
