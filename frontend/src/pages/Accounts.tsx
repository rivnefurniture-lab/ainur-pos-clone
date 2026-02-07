import { useEffect } from 'react';
import styled from 'styled-components';
import { Wallet, Plus, CreditCard, Building2, Smartphone, MoreVertical } from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchAccounts } from '../store/slices/dataSlice';
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

const TotalCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  margin-bottom: 24px;
`;

const TotalLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
`;

const TotalValue = styled.div`
  font-size: 36px;
  font-weight: 700;
`;

const AccountsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const AccountCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  padding: 20px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.primary};
  }
`;

const AccountHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const AccountInfo = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const AccountIcon = styled.div<{ type: string }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.type) {
      case 'cash': return theme.colors.successLight;
      case 'card': return theme.colors.infoLight;
      case 'bank_account': return theme.colors.warningLight;
      default: return theme.colors.gray100;
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'cash': return theme.colors.success;
      case 'card': return theme.colors.info;
      case 'bank_account': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  }};
`;

const AccountName = styled.div`
  font-size: 15px;
  font-weight: 600;
`;

const AccountType = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
`;

const MenuButton = styled.button`
  padding: 8px;
  border-radius: 6px;
  color: ${theme.colors.textMuted};

  &:hover {
    background: ${theme.colors.gray100};
  }
`;

const AccountBalance = styled.div`
  text-align: center;
  padding: 16px 0;
  border-top: 1px solid ${theme.colors.border};
  margin-top: 16px;
`;

const BalanceValue = styled.div<{ negative?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.negative ? theme.colors.danger : theme.colors.textPrimary};
`;

const BalanceLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin-top: 4px;
`;

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'cash': return <Wallet size={22} />;
    case 'card': case 'terminal': return <CreditCard size={22} />;
    case 'bank_account': return <Building2 size={22} />;
    case 'online': return <Smartphone size={22} />;
    default: return <Wallet size={22} />;
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'cash': return 'Готівка';
    case 'card': return 'Картка';
    case 'terminal': return 'Термінал';
    case 'bank_account': return 'Банківський рахунок';
    case 'online': return 'Онлайн';
    default: return type;
  }
};

export default function Accounts() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { accounts } = useAppSelector(state => state.data);

  useEffect(() => {
    if (user) {
      dispatch(fetchAccounts(user._client));
    }
  }, [dispatch, user]);

  const formatPrice = (price: number) => price.toFixed(2) + ' ₴';

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance?.balance || 0), 0);

  return (
    <MainLayout title="Рахунки">
      <PageHeader>
        <PageTitle>Фінансові рахунки</PageTitle>
        <AddButton>
          <Plus size={18} />
          Додати рахунок
        </AddButton>
      </PageHeader>

      <TotalCard>
        <TotalLabel>Загальний баланс</TotalLabel>
        <TotalValue>{formatPrice(totalBalance)}</TotalValue>
      </TotalCard>

      <AccountsGrid>
        {accounts.map(account => (
          <AccountCard key={account._id}>
            <AccountHeader>
              <AccountInfo>
                <AccountIcon type={account.type}>
                  {getTypeIcon(account.type)}
                </AccountIcon>
                <div>
                  <AccountName>{account.name}</AccountName>
                  <AccountType>{getTypeName(account.type)}</AccountType>
                </div>
              </AccountInfo>
              <MenuButton>
                <MoreVertical size={18} />
              </MenuButton>
            </AccountHeader>

            <AccountBalance>
              <BalanceValue negative={(account.balance?.balance || 0) < 0}>
                {formatPrice(account.balance?.balance || 0)}
              </BalanceValue>
              <BalanceLabel>Поточний баланс</BalanceLabel>
            </AccountBalance>
          </AccountCard>
        ))}
      </AccountsGrid>
    </MainLayout>
  );
}
