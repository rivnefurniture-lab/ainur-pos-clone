import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Globe, BarChart2, Bell } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { checkAuth, setUser } from '../../store/slices/authSlice';
import { fetchAllData } from '../../store/slices/dataSlice';
import { fetchCurrentShift } from '../../store/slices/shiftSlice';
import Sidebar from './Sidebar';
import { theme } from '../../styles/GlobalStyles';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${theme.colors.background};
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  height: 56px;
  background: #34495e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const HeaderTitle = styled.h1`
  font-size: 16px;
  font-weight: 500;
  color: white;
  margin: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CashierButton = styled.button`
  padding: 8px 16px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #3a7fc8;
  }
`;

const LangButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.1);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    background: rgba(255,255,255,0.2);
  }
`;

const IconButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: rgba(255,255,255,0.7);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-left: 8px;

  &:hover {
    background: rgba(255,255,255,0.1);
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f39c12;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
`;

const UserName = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const UserNameText = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: white;
`;

const UserRole = styled.span`
  font-size: 11px;
  color: rgba(255,255,255,0.6);
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid ${theme.colors.gray200};
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

// Default user for auto-login
const DEFAULT_USER = {
  _id: '58c872aa3ce7d5fc688b49bc',
  name: 'Олег Кицюк',
  email: 'o_kytsuk@mail.ru',
  role: 'admin' as const,
  _client: '58c872aa3ce7d5fc688b49bd',
};

const DEFAULT_COMPANY_ID = '58c872aa3ce7d5fc688b49bd';

export default function MainLayout({ children, title = 'Dashboard' }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, companyId, isAuthenticated, isLoading: authLoading } = useAppSelector(state => state.auth);
  const { isLoading: dataLoading } = useAppSelector(state => state.data);

  // Auto-login on mount
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      // Auto set user without login
      dispatch({
        type: 'auth/login/fulfilled',
        payload: {
          user: DEFAULT_USER,
          client: { _id: DEFAULT_COMPANY_ID, name: 'Loveiska Toys' },
        },
      });
    }
  }, [dispatch, isAuthenticated, authLoading]);

  useEffect(() => {
    const effectiveCompanyId = companyId || DEFAULT_COMPANY_ID;
    if (effectiveCompanyId) {
      dispatch(fetchAllData(effectiveCompanyId));
      dispatch(fetchCurrentShift(effectiveCompanyId));
    }
  }, [dispatch, companyId]);

  // Get page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/pos') return 'Головна';
    if (path.includes('/products')) return 'Товари та послуги';
    if (path.includes('/documents')) return 'Документи';
    if (path.includes('/shifts')) return 'Зміни';
    if (path.includes('/customers')) return 'Клієнти';
    if (path.includes('/suppliers')) return 'Постачальники';
    if (path.includes('/reports')) return 'Звіти';
    if (path.includes('/settings')) return 'Налаштування';
    if (path.includes('/accounts')) return 'Рахунки';
    if (path.includes('/money')) return 'Рух грошей';
    if (path.includes('/movements')) return 'Рух товару';
    if (path.includes('/stores')) return 'Магазини';
    return title;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayUser = user || DEFAULT_USER;

  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <Header>
          <HeaderLeft>
            <HeaderTitle>{getPageTitle()}</HeaderTitle>
          </HeaderLeft>
          <HeaderRight>
            <CashierButton onClick={() => navigate('/pos/cashier')}>
              Інтерфейс касира
            </CashierButton>
            <LangButton>
              <Globe size={16} />
              Українська
            </LangButton>
            <IconButton>
              <BarChart2 size={18} />
            </IconButton>
            <IconButton>
              <Bell size={18} />
            </IconButton>
            <UserInfo>
              <UserAvatar>{getInitials(displayUser.name)}</UserAvatar>
              <UserName>
                <UserNameText>{displayUser.name}</UserNameText>
                <UserRole>Власник</UserRole>
              </UserName>
            </UserInfo>
          </HeaderRight>
        </Header>
        <ContentArea>
          {dataLoading ? (
            <LoadingOverlay style={{ position: 'absolute' }}>
              <LoadingSpinner />
            </LoadingOverlay>
          ) : (
            children
          )}
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
}
