import { useEffect } from 'react';
import styled from 'styled-components';
import { Store as StoreIcon, Plus, MapPin, MoreVertical } from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchStores } from '../store/slices/dataSlice';
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
  color: ${theme.colors.textPrimary};
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

const StoresGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
`;

const StoreCard = styled.div`
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

const StoreHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const StoreInfo = styled.div`
  display: flex;
  gap: 12px;
`;

const StoreIconWrapper = styled.div<{ isDefault?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.isDefault ? theme.colors.primaryLight : theme.colors.gray100};
  color: ${props => props.isDefault ? theme.colors.primary : theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StoreName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const StoreType = styled.span`
  font-size: 12px;
  color: ${theme.colors.textMuted};
`;

const DefaultBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  background: ${theme.colors.success};
  color: white;
  border-radius: 10px;
  margin-left: 8px;
`;

const MenuButton = styled.button`
  padding: 8px;
  border-radius: 6px;
  color: ${theme.colors.textMuted};

  &:hover {
    background: ${theme.colors.gray100};
  }
`;

const StoreAddress = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 16px;

  svg {
    flex-shrink: 0;
  }
`;

const StoreStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${theme.colors.border};
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div<{ color?: string }>`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.color || theme.colors.textPrimary};
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
`;

const getTypeName = (type: string) => {
  switch (type) {
    case 'store': return 'Магазин';
    case 'warehouse': return 'Склад';
    case 'office': return 'Офіс';
    case 'production': return 'Виробництво';
    default: return type;
  }
};

export default function Stores() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { stores } = useAppSelector(state => state.data);

  useEffect(() => {
    if (user) {
      dispatch(fetchStores(user._client));
    }
  }, [dispatch, user]);

  const formatPrice = (price: number) => price.toFixed(2) + ' ₴';

  return (
    <MainLayout title="Магазини">
      <PageHeader>
        <PageTitle>Магазини та склади</PageTitle>
        <AddButton>
          <Plus size={18} />
          Додати локацію
        </AddButton>
      </PageHeader>

      <StoresGrid>
        {stores.map(store => (
          <StoreCard key={store._id}>
            <StoreHeader>
              <StoreInfo>
                <StoreIconWrapper isDefault={store.default}>
                  <StoreIcon size={24} />
                </StoreIconWrapper>
                <div>
                  <StoreName>
                    {store.name}
                    {store.default && <DefaultBadge>За замовч.</DefaultBadge>}
                  </StoreName>
                  <StoreType>{getTypeName(store.type)}</StoreType>
                </div>
              </StoreInfo>
              <MenuButton>
                <MoreVertical size={18} />
              </MenuButton>
            </StoreHeader>

            {store.address && (
              <StoreAddress>
                <MapPin size={16} />
                {store.address}
              </StoreAddress>
            )}

            <StoreStats>
              <StatItem>
                <StatValue color={theme.colors.success}>
                  {formatPrice(store.balance?.income || 0)}
                </StatValue>
                <StatLabel>Надходження</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue color={theme.colors.danger}>
                  {formatPrice(store.balance?.outcome || 0)}
                </StatValue>
                <StatLabel>Витрати</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>
                  {formatPrice(store.balance?.balance || 0)}
                </StatValue>
                <StatLabel>Баланс</StatLabel>
              </StatItem>
            </StoreStats>
          </StoreCard>
        ))}
      </StoresGrid>
    </MainLayout>
  );
}
