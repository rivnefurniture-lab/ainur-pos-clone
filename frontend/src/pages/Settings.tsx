import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  Settings as SettingsIcon,
  Users,
  Store,
  CreditCard,
  Heart,
  Printer,
  Globe,
  Plus,
  Phone,
  Mail,
  MapPin,
  MoreVertical,
  X,
  Edit,
  Trash2,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { fetchStores } from '../store/slices/dataSlice';
import { theme } from '../styles/GlobalStyles';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ============================================
// Types
// ============================================
interface Employee {
  _id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  avatar?: string;
  stores?: string[];
}

// ============================================
// Styled Components
// ============================================
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 60px);
`;

const CompanyHeader = styled.div`
  margin-bottom: 24px;
`;

const CompanyName = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin: 0;
`;

const CompanyMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  font-size: 14px;
  color: ${theme.colors.textSecondary};
`;

const CompanyId = styled.span`
  color: ${theme.colors.textMuted};
`;

const CompanyLabel = styled.span`
  color: ${theme.colors.textMuted};
`;

// Tabs
const TabsContainer = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid ${theme.colors.border};
  margin-bottom: 24px;
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  border-bottom: 2px solid ${props => props.active ? theme.colors.textPrimary : 'transparent'};
  color: ${props => props.active ? theme.colors.textPrimary : theme.colors.textSecondary};
  background: transparent;
  margin-bottom: -1px;

  &:hover {
    color: ${theme.colors.textPrimary};
  }
`;

// Settings Form
const FormSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
`;

const FormRow = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const FormInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 15px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FormSelect = styled.select`
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 15px;
  background: white;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const FormSelectActive = styled(FormSelect)`
  border-color: ${theme.colors.success};
  color: ${theme.colors.success};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 600px;
`;

const PhoneList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PhoneItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RemoveButton = styled.button`
  padding: 8px;
  color: ${theme.colors.textMuted};
  &:hover {
    color: ${theme.colors.danger};
  }
`;

const AddLink = styled.button`
  color: ${theme.colors.primary};
  font-size: 14px;
  &:hover {
    text-decoration: underline;
  }
`;

// Cards Grid (for Employees, Stores, Accounts)
const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const Card = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  position: relative;
`;

const CreateCard = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  cursor: pointer;
  border-style: dashed;

  &:hover {
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primaryLight};
  }
`;

const CreateCardContent = styled.div`
  text-align: center;
  color: ${theme.colors.textMuted};
`;

const CreateCardButton = styled.button`
  padding: 8px 20px;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  background: white;
  margin-top: 8px;

  &:hover {
    background: #f5f5f5;
  }
`;

const CardMenu = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px;
  color: ${theme.colors.textMuted};

  &:hover {
    color: ${theme.colors.textPrimary};
  }
`;

const CardCheck = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  color: ${theme.colors.success};
`;

// Employee Card
const EmployeeAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${theme.colors.gray100};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const EmployeeName = styled.div`
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 4px;
`;

const EmployeeRole = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  text-align: center;
  margin-bottom: 16px;
`;

const EmployeeContact = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${theme.colors.primary};
  margin-bottom: 8px;

  &:hover {
    text-decoration: underline;
  }
`;

// Store Card
const StoreCardLabel = styled.div`
  font-size: 11px;
  color: ${theme.colors.textMuted};
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const StoreIcon = styled.div`
  width: 50px;
  height: 50px;
  background: ${theme.colors.gray100};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`;

const StoreName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.primary};
  margin-bottom: 8px;
`;

const StoreDate = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const StoreAddress = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const StoreActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const StoreEditButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.success};
  border-radius: 4px;
  color: ${theme.colors.success};
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: #f0fdf4;
  }
`;

const StoreDeleteButton = styled.button`
  padding: 8px 12px;
  border: 1px solid ${theme.colors.danger};
  border-radius: 4px;
  color: ${theme.colors.danger};

  &:hover {
    background: #fef2f2;
  }
`;

// Account Card
const AccountIcon = styled.div`
  width: 50px;
  height: 50px;
  background: ${theme.colors.gray100};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: ${theme.colors.textMuted};
`;

const AccountName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.primary};
  margin-bottom: 4px;
`;

const AccountDate = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin-bottom: 8px;
`;

const AccountBalance = styled.div`
  font-size: 14px;
  margin-bottom: 16px;

  span {
    color: ${theme.colors.textSecondary};
  }
`;

// Total Balance Bar
const TotalBalanceBar = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
  font-size: 16px;
  font-weight: 600;
`;

// Loyalty Section
const LoyaltyHeader = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const LoyaltyTab = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  background: ${props => props.active ? 'white' : 'transparent'};
  border: 1px solid ${props => props.active ? theme.colors.border : 'transparent'};
  border-bottom: ${props => props.active ? '1px solid white' : 'none'};
  border-radius: 4px 4px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.active ? theme.colors.textPrimary : theme.colors.textSecondary};
`;

const LoyaltyStats = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
`;

const LoyaltyStat = styled.div`
  background: ${theme.colors.primaryLight};
  border-radius: 8px;
  padding: 20px 24px;
  min-width: 200px;
`;

const LoyaltyStatLabel = styled.div`
  font-size: 13px;
  color: ${theme.colors.primary};
  margin-bottom: 4px;
`;

const LoyaltyStatValue = styled.div`
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.primary};
`;

const LoyaltySection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
`;

const LoyaltyTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px;
`;

const LoyaltySetting = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
`;

const LoyaltyInput = styled.input`
  width: 60px;
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
`;

const LoyaltyInputSuffix = styled.span`
  padding: 8px 12px;
  background: ${theme.colors.gray100};
  border: 1px solid ${theme.colors.border};
  border-left: none;
  border-radius: 0 4px 4px 0;
  font-size: 14px;
  color: ${theme.colors.textSecondary};
`;

const LoyaltyDescription = styled.span`
  color: ${theme.colors.textSecondary};
  font-size: 14px;
`;

const Toggle = styled.button<{ enabled?: boolean }>`
  width: 48px;
  height: 26px;
  border-radius: 13px;
  padding: 2px;
  background: ${props => props.enabled ? theme.colors.primary : theme.colors.gray200};

  &::after {
    content: '';
    display: block;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    transform: translateX(${props => props.enabled ? '22px' : '0'});
    transition: transform 0.2s ease;
  }
`;

// Summary
const SummaryBox = styled.div`
  margin-bottom: 24px;
`;

const SummaryTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
`;

const SummaryList = styled.ul`
  list-style: disc;
  padding-left: 20px;
  font-size: 14px;
  color: ${theme.colors.textSecondary};
  line-height: 1.8;
`;

// ============================================
// Component
// ============================================
export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { stores, accounts } = useAppSelector(state => state.data);

  const [activeTab, setActiveTab] = useState('main');
  const [loyaltyTab, setLoyaltyTab] = useState<'bonus' | 'discount'>('bonus');
  const [bonusActive, setBonusActive] = useState(false);

  // Mock employees data
  const employees: Employee[] = [
    { _id: '1', name: 'Олена Євтушок', role: 'Управляющий', phone: '0930583383', email: 'elenaevtushok@gmail.com' },
    { _id: '2', name: 'Валерій Осницький', role: 'Управляющий', phone: '+380637952452', email: 'loveiska_com@mail.com' },
    { _id: '3', name: 'Артем Софійчук', role: 'Управляющий', phone: '+380984179660', email: 'artemsofi@ukr.net' },
    { _id: '4', name: 'Океан Плаза (СТАЖОР)', role: 'Касир', phone: '+380939713320' },
    { _id: '5', name: 'Полякова Катя', role: 'Касир', phone: '380632673012' },
  ];

  useEffect(() => {
    if (user) {
      dispatch(fetchStores(user._client));
    }
  }, [dispatch, user]);

  // Determine which page to show based on URL
  const currentPath = location.pathname;
  const isEmployees = currentPath.includes('employees');
  const isStores = currentPath.includes('stores') && !currentPath.includes('online-store');
  const isAccounts = currentPath.includes('accounts');
  const isLoyalty = currentPath.includes('loyalty');
  const isCompanySettings = currentPath.includes('company') || currentPath.includes('settings');

  const formatPrice = (price: number) => {
    const parts = (price || 0).toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',');
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'owner': return 'Власник';
      case 'Управляющий': return 'Управляючий';
      case 'Касир': return 'Касир';
      case 'manager': return 'Менеджер';
      case 'cashier': return 'Касир';
      default: return role;
    }
  };

  // Employees Page
  if (isEmployees) {
    const ownerCount = 1;
    const managerCount = employees.filter(e => e.role === 'Управляющий').length;
    const cashierCount = employees.filter(e => e.role === 'Касир').length;
    const warehouseCount = 0;

    return (
      <MainLayout title="Співробітники">
        <PageContainer>
          <SummaryBox>
            <SummaryTitle>Всього {employees.length + 1} співробітників</SummaryTitle>
            <SummaryList>
              <li>Власників: {ownerCount}</li>
              <li>Управляючих: {managerCount}</li>
              <li>Касирів: {cashierCount}</li>
              <li>Кладовщиків: {warehouseCount}</li>
            </SummaryList>
          </SummaryBox>

          <CardsGrid>
            <CreateCard>
              <CreateCardContent>
                <CreateCardButton>Створити</CreateCardButton>
              </CreateCardContent>
            </CreateCard>

            {employees.map(emp => (
              <Card key={emp._id}>
                <CardMenu><MoreVertical size={18} /></CardMenu>
                <EmployeeAvatar>
                  {emp.avatar ? <img src={emp.avatar} alt="" /> : <Users size={24} color="#9ca3af" />}
                </EmployeeAvatar>
                <EmployeeName>{emp.name}</EmployeeName>
                <EmployeeRole>{getRoleName(emp.role)}</EmployeeRole>
                {emp.phone && (
                  <EmployeeContact href={`tel:${emp.phone}`}>
                    <Phone size={14} />
                    {emp.phone}
                  </EmployeeContact>
                )}
                {emp.email && (
                  <EmployeeContact href={`mailto:${emp.email}`}>
                    <Mail size={14} />
                    {emp.email}
                  </EmployeeContact>
                )}
              </Card>
            ))}
          </CardsGrid>
        </PageContainer>
      </MainLayout>
    );
  }

  // Stores Page
  if (isStores) {
    return (
      <MainLayout title="Магазини">
        <PageContainer>
          <CardsGrid>
            <CreateCard>
              <CreateCardContent>
                <CreateCardButton>Створити</CreateCardButton>
              </CreateCardContent>
            </CreateCard>

            {stores.map(store => (
              <Card key={store._id}>
                <StoreIcon><Store size={24} color="#9ca3af" /></StoreIcon>
                <StoreName>{store.name}</StoreName>
                <StoreDate>
                  <span>📅</span> Створено {store.created ? format(new Date(store.created * 1000), 'd MMMM yyyy', { locale: ru }) : '—'}
                </StoreDate>
                {store.address && (
                  <StoreAddress>
                    <MapPin size={14} />
                    {store.address}
                  </StoreAddress>
                )}
                <StoreActions>
                  <StoreEditButton>
                    <Edit size={14} />
                    Редагувати
                  </StoreEditButton>
                  <StoreDeleteButton>
                    <Trash2 size={14} />
                  </StoreDeleteButton>
                </StoreActions>
              </Card>
            ))}
          </CardsGrid>
        </PageContainer>
      </MainLayout>
    );
  }

  // Accounts Page
  if (isAccounts) {
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance?.balance || 0), 0);

    return (
      <MainLayout title="Рахунки">
        <PageContainer>
          <TotalBalanceBar>
            Баланс {formatPrice(totalBalance)} грн
          </TotalBalanceBar>

          <CardsGrid>
            <CreateCard>
              <CreateCardContent>
                <CreateCardButton>Створити</CreateCardButton>
              </CreateCardContent>
            </CreateCard>

            {accounts.map(acc => (
              <Card key={acc._id}>
                <StoreCardLabel>Розрахунковий счёт</StoreCardLabel>
                <AccountIcon><CreditCard size={24} /></AccountIcon>
                <AccountName>{acc.name}</AccountName>
                <AccountDate>
                  📅 Створено {acc.created ? format(new Date(acc.created * 1000), 'd MMMM yyyy', { locale: ru }) : '—'}
                </AccountDate>
                <AccountBalance>
                  <span>Баланс </span>{formatPrice(acc.balance?.balance || 0)} грн
                </AccountBalance>
                <StoreActions>
                  <StoreEditButton>
                    <Edit size={14} />
                    Редагувати
                  </StoreEditButton>
                  <StoreDeleteButton>
                    <Trash2 size={14} />
                  </StoreDeleteButton>
                </StoreActions>
              </Card>
            ))}
          </CardsGrid>
        </PageContainer>
      </MainLayout>
    );
  }

  // Loyalty Page
  if (isLoyalty) {
    return (
      <MainLayout title="Лояльність">
        <PageContainer>
          <CompanyName>Лояльність</CompanyName>

          <LoyaltyHeader style={{ marginTop: 24 }}>
            <LoyaltyTab active={loyaltyTab === 'bonus'} onClick={() => setLoyaltyTab('bonus')}>
              Бонусна система
            </LoyaltyTab>
            <LoyaltyTab active={loyaltyTab === 'discount'} onClick={() => setLoyaltyTab('discount')}>
              Знижки
            </LoyaltyTab>
          </LoyaltyHeader>

          {loyaltyTab === 'bonus' && (
            <>
              <LoyaltyStats>
                <LoyaltyStat>
                  <LoyaltyStatLabel>Сгенерований кешбек</LoyaltyStatLabel>
                  <LoyaltyStatValue>0</LoyaltyStatValue>
                </LoyaltyStat>
                <LoyaltyStat>
                  <LoyaltyStatLabel>Витрачено бонусів</LoyaltyStatLabel>
                  <LoyaltyStatValue>0</LoyaltyStatValue>
                </LoyaltyStat>
              </LoyaltyStats>

              <LoyaltySection>
                <LoyaltyTitle>Налаштування програми</LoyaltyTitle>

                <LoyaltySetting>
                  <Toggle enabled={bonusActive} onClick={() => setBonusActive(!bonusActive)} />
                  <span>Бонусна система не активна</span>
                </LoyaltySetting>

                <LoyaltySetting>
                  <LoyaltyInput defaultValue="3" />
                  <LoyaltyInputSuffix>%</LoyaltyInputSuffix>
                  <LoyaltyDescription>Курс нарахування — Кожні 100.00 грн в чеку = 3 бонуси на рахунок</LoyaltyDescription>
                </LoyaltySetting>

                <LoyaltySetting>
                  <LoyaltyInput defaultValue="100" />
                  <LoyaltyInputSuffix>%</LoyaltyInputSuffix>
                  <LoyaltyDescription>Курс списання — 1 бонус = 1.00 грн знижки в чеку</LoyaltyDescription>
                </LoyaltySetting>

                <LoyaltySetting>
                  <LoyaltyInput defaultValue="30" />
                  <LoyaltyInputSuffix>%</LoyaltyInputSuffix>
                  <LoyaltyDescription>Ліміт оплати — 30% чека можна оплатити бонусами</LoyaltyDescription>
                </LoyaltySetting>

                <LoyaltySetting>
                  <LoyaltyInput defaultValue="100" />
                  <LoyaltyInputSuffix>Ƀ</LoyaltyInputSuffix>
                  <LoyaltyDescription>Стартові бонуси — Поступлять на рахунок нового покупця</LoyaltyDescription>
                </LoyaltySetting>

                <LoyaltySetting>
                  <LoyaltyInput defaultValue="0" />
                  <LoyaltyInputSuffix>Ƀ</LoyaltyInputSuffix>
                  <LoyaltyDescription>Бонуси на День народження — Поступлять на рахунок клієнта в його День народження</LoyaltyDescription>
                </LoyaltySetting>
              </LoyaltySection>
            </>
          )}

          {loyaltyTab === 'discount' && (
            <LoyaltySection>
              <LoyaltyTitle>Система знижок</LoyaltyTitle>
              <p style={{ color: theme.colors.textSecondary }}>
                Налаштуйте знижки для клієнтів на сторінці редагування клієнта.
              </p>
            </LoyaltySection>
          )}
        </PageContainer>
      </MainLayout>
    );
  }

  // Default: Company Settings
  return (
    <MainLayout title="Налаштування">
      <PageContainer>
        <CompanyHeader>
          <CompanyName>Loveiska</CompanyName>
          <CompanyMeta>
            <span>Створено 15 березня 2017</span>
            <CompanyId>ID 58c872aa3ce7d5fc688b49bd</CompanyId>
            <CompanyLabel>Компанія</CompanyLabel>
          </CompanyMeta>
        </CompanyHeader>

        <TabsContainer>
          <Tab active={activeTab === 'main'} onClick={() => setActiveTab('main')}>Основні</Tab>
          <Tab active={activeTab === 'details'} onClick={() => setActiveTab('details')}>Реквізити</Tab>
          <Tab active={activeTab === 'taxes'} onClick={() => setActiveTab('taxes')}>Податки</Tab>
          <Tab active={activeTab === 'email'} onClick={() => setActiveTab('email')}>Email звіт</Tab>
          <Tab active={activeTab === 'data'} onClick={() => setActiveTab('data')}>Дані</Tab>
        </TabsContainer>

        <FormSection>
          <FormRow>
            <FormLabel>Найменування організації</FormLabel>
            <FormInput defaultValue="Loveiska" />
          </FormRow>

          <FormGrid>
            <FormRow>
              <FormLabel>Країна</FormLabel>
              <FormSelectActive defaultValue="ukraine">
                <option value="ukraine">Ukraine</option>
              </FormSelectActive>
            </FormRow>
            <FormRow>
              <FormLabel>Основна валюта</FormLabel>
              <FormSelectActive defaultValue="uah">
                <option value="uah">Українська гривня</option>
              </FormSelectActive>
            </FormRow>
          </FormGrid>

          <FormRow>
            <FormLabel>Відображення валюти</FormLabel>
            <FormInput defaultValue="грн" style={{ width: 100 }} />
          </FormRow>

          <FormRow>
            <FormLabel>Префікс штрих-коду вагового товару (?)</FormLabel>
            <FormInput defaultValue="21" style={{ width: 100 }} />
          </FormRow>

          <FormRow>
            <FormLabel>Телефон <AddLink>(додати ще)</AddLink></FormLabel>
            <PhoneList>
              <PhoneItem>
                <FormInput defaultValue="+38 (096) 183 8338" />
                <RemoveButton><X size={18} /></RemoveButton>
              </PhoneItem>
              <PhoneItem>
                <FormInput defaultValue="+38 (063) 152 5660" />
                <RemoveButton><X size={18} /></RemoveButton>
              </PhoneItem>
              <PhoneItem>
                <FormInput defaultValue="+38 (093) 058 3383" />
                <RemoveButton><X size={18} /></RemoveButton>
              </PhoneItem>
            </PhoneList>
          </FormRow>

          <FormRow>
            <FormLabel>Email <AddLink>(додати ще)</AddLink></FormLabel>
            <PhoneList>
              <PhoneItem>
                <FormInput type="email" defaultValue="" placeholder="email@example.com" />
                <RemoveButton><X size={18} /></RemoveButton>
              </PhoneItem>
            </PhoneList>
          </FormRow>
        </FormSection>
      </PageContainer>
    </MainLayout>
  );
}
