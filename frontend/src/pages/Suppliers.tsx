import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Truck, Plus, Phone, Mail, Globe, MoreVertical, Search } from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchSuppliers } from '../store/slices/dataSlice';
import { theme } from '../styles/GlobalStyles';

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${theme.colors.primary};
  color: white;
  border-radius: 8px;
  font-weight: 500;

  &:hover {
    background: ${theme.colors.primaryHover};
  }
`;

const SearchBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const SearchInput = styled.div`
  flex: 1;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
  }

  svg {
    color: ${theme.colors.textMuted};
  }
`;

const SuppliersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
`;

const SupplierCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  padding: 20px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.primary};
    box-shadow: ${theme.shadows.md};
  }
`;

const SupplierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const SupplierInfo = styled.div`
  display: flex;
  gap: 12px;
`;

const SupplierIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: ${theme.colors.infoLight};
  color: ${theme.colors.info};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SupplierName = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const SupplierDescription = styled.div`
  font-size: 13px;
  color: ${theme.colors.textMuted};
  margin-top: 2px;
`;

const MenuButton = styled.button`
  padding: 8px;
  border-radius: 6px;
  color: ${theme.colors.textMuted};

  &:hover {
    background: ${theme.colors.gray100};
  }
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const ContactItem = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};

  &:hover {
    color: ${theme.colors.primary};
  }

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }
`;

const SupplierStats = styled.div`
  display: flex;
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid ${theme.colors.border};
`;

const StatItem = styled.div`
  flex: 1;
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color || theme.colors.textPrimary};
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${theme.colors.textMuted};
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
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

export default function Suppliers() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { suppliers } = useAppSelector(state => state.data);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      dispatch(fetchSuppliers(user._client));
    }
  }, [dispatch, user]);

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(query) ||
           s.description?.toLowerCase().includes(query);
  });

  const formatPrice = (price: number) => price.toFixed(2) + ' ₴';

  return (
    <MainLayout title="Постачальники">
      <PageHeader>
        <PageTitle>Постачальники</PageTitle>
        <AddButton>
          <Plus size={18} />
          Додати постачальника
        </AddButton>
      </PageHeader>

      <SearchBar>
        <SearchInput>
          <Search size={18} />
          <input
            type="text"
            placeholder="Пошук постачальників..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchInput>
      </SearchBar>

      <SuppliersGrid>
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map(supplier => (
            <SupplierCard key={supplier._id}>
              <SupplierHeader>
                <SupplierInfo>
                  <SupplierIcon>
                    <Truck size={24} />
                  </SupplierIcon>
                  <div>
                    <SupplierName>{supplier.name}</SupplierName>
                    {supplier.description && (
                      <SupplierDescription>{supplier.description}</SupplierDescription>
                    )}
                  </div>
                </SupplierInfo>
                <MenuButton>
                  <MoreVertical size={18} />
                </MenuButton>
              </SupplierHeader>

              <ContactList>
                {supplier.phones[0] && (
                  <ContactItem href={`tel:${supplier.phones[0]}`}>
                    <Phone />
                    {supplier.phones[0]}
                  </ContactItem>
                )}
                {supplier.emails[0] && (
                  <ContactItem href={`mailto:${supplier.emails[0]}`}>
                    <Mail />
                    {supplier.emails[0]}
                  </ContactItem>
                )}
                {supplier.site && (
                  <ContactItem href={supplier.site} target="_blank" rel="noopener">
                    <Globe />
                    {supplier.site}
                  </ContactItem>
                )}
              </ContactList>

              <SupplierStats>
                <StatItem>
                  <StatValue color={supplier.discount > 0 ? theme.colors.success : undefined}>
                    {supplier.discount}%
                  </StatValue>
                  <StatLabel>Знижка</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue color={supplier.debt > 0 ? theme.colors.danger : undefined}>
                    {formatPrice(supplier.debt)}
                  </StatValue>
                  <StatLabel>Борг їм</StatLabel>
                </StatItem>
                <StatItem>
                  <StatValue color={supplier.rdebt > 0 ? theme.colors.success : undefined}>
                    {formatPrice(supplier.rdebt)}
                  </StatValue>
                  <StatLabel>Їхній борг</StatLabel>
                </StatItem>
              </SupplierStats>
            </SupplierCard>
          ))
        ) : (
          <EmptyState>
            <Truck size={64} />
            <h3>Постачальників не знайдено</h3>
            <p>Додайте першого постачальника для початку роботи</p>
          </EmptyState>
        )}
      </SuppliersGrid>
    </MainLayout>
  );
}
