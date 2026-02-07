import styled from 'styled-components';
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Receipt,
  Printer,
  Bell,
  Shield,
  Palette,
  Globe,
  ChevronRight,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppSelector } from '../hooks/useRedux';
import { theme } from '../styles/GlobalStyles';

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const PageDescription = styled.p`
  color: ${theme.colors.textSecondary};
  margin: 8px 0 0;
  font-size: 14px;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
`;

const SettingsNav = styled.nav`
  background: white;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  padding: 12px;
  height: fit-content;
`;

const NavItem = styled.button<{ active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  transition: all 0.2s ease;
  background: ${props => props.active ? theme.colors.primaryLight : 'transparent'};
  color: ${props => props.active ? theme.colors.primary : theme.colors.textSecondary};

  &:hover {
    background: ${props => props.active ? theme.colors.primaryLight : theme.colors.gray100};
  }

  svg {
    flex-shrink: 0;
  }
`;

const SettingsContent = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  padding: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
`;

const SectionDescription = styled.p`
  color: ${theme.colors.textSecondary};
  font-size: 14px;
  margin: 0 0 24px;
`;

const SettingsSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.textPrimary};
  margin-bottom: 2px;
`;

const SettingDescription = styled.div`
  font-size: 13px;
  color: ${theme.colors.textMuted};
`;

const Toggle = styled.button<{ enabled?: boolean }>`
  width: 48px;
  height: 26px;
  border-radius: 13px;
  padding: 2px;
  transition: all 0.2s ease;
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

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  background: white;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;
  font-size: 14px;
  width: 200px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  background: ${props => {
    switch (props.variant) {
      case 'primary': return theme.colors.primary;
      case 'danger': return theme.colors.dangerLight;
      default: return 'white';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'primary': return 'white';
      case 'danger': return theme.colors.danger;
      default: return theme.colors.textPrimary;
    }
  }};
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'primary': return theme.colors.primary;
      case 'danger': return theme.colors.danger;
      default: return theme.colors.border;
    }
  }};

  &:hover {
    opacity: 0.9;
  }
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: ${theme.colors.gray50};
  border-radius: 12px;
  margin-bottom: 24px;
`;

const UserAvatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: 600;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const UserEmail = styled.div`
  font-size: 14px;
  color: ${theme.colors.textSecondary};
`;

const UserRole = styled.span`
  display: inline-block;
  padding: 4px 10px;
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primary};
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
`;

export default function Settings() {
  const { user } = useAppSelector(state => state.auth);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'owner': return 'Власник';
      case 'admin': return 'Адміністратор';
      case 'manager': return 'Менеджер';
      case 'cashier': return 'Касир';
      default: return role;
    }
  };

  return (
    <MainLayout title="Налаштування">
      <PageHeader>
        <PageTitle>Налаштування</PageTitle>
        <PageDescription>Керуйте параметрами системи та особистим профілем</PageDescription>
      </PageHeader>

      <SettingsGrid>
        <SettingsNav>
          <NavItem active>
            <User size={20} />
            Профіль
          </NavItem>
          <NavItem>
            <Building2 size={20} />
            Компанія
          </NavItem>
          <NavItem>
            <Receipt size={20} />
            Чеки
          </NavItem>
          <NavItem>
            <Printer size={20} />
            Принтери
          </NavItem>
          <NavItem>
            <Bell size={20} />
            Сповіщення
          </NavItem>
          <NavItem>
            <Shield size={20} />
            Безпека
          </NavItem>
          <NavItem>
            <Palette size={20} />
            Вигляд
          </NavItem>
          <NavItem>
            <Globe size={20} />
            Мова
          </NavItem>
        </SettingsNav>

        <SettingsContent>
          <UserCard>
            <UserAvatar>
              {user ? getInitials(user.name) : 'U'}
            </UserAvatar>
            <UserInfo>
              <UserName>{user?.name}</UserName>
              <UserEmail>{user?.email}</UserEmail>
              <UserRole>{user ? getRoleName(user.role) : ''}</UserRole>
            </UserInfo>
            <Button>Редагувати</Button>
          </UserCard>

          <SettingsSection>
            <SectionTitle>Основні налаштування</SectionTitle>
            <SectionDescription>Загальні параметри вашого облікового запису</SectionDescription>

            <SettingItem>
              <SettingInfo>
                <SettingLabel>Мова інтерфейсу</SettingLabel>
                <SettingDescription>Мова відображення системи</SettingDescription>
              </SettingInfo>
              <Select defaultValue="uk">
                <option value="uk">Українська</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </Select>
            </SettingItem>

            <SettingItem>
              <SettingInfo>
                <SettingLabel>Часовий пояс</SettingLabel>
                <SettingDescription>Ваш локальний часовий пояс</SettingDescription>
              </SettingInfo>
              <Select defaultValue="europe-kyiv">
                <option value="europe-kyiv">Київ (UTC+2)</option>
                <option value="europe-london">Лондон (UTC+0)</option>
              </Select>
            </SettingItem>

            <SettingItem>
              <SettingInfo>
                <SettingLabel>Валюта за замовчуванням</SettingLabel>
                <SettingDescription>Основна валюта для розрахунків</SettingDescription>
              </SettingInfo>
              <Select defaultValue="UAH">
                <option value="UAH">UAH (₴)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </Select>
            </SettingItem>
          </SettingsSection>

          <SettingsSection>
            <SectionTitle>Сповіщення</SectionTitle>
            <SectionDescription>Налаштуйте способи отримання сповіщень</SectionDescription>

            <SettingItem>
              <SettingInfo>
                <SettingLabel>Email сповіщення</SettingLabel>
                <SettingDescription>Отримувати звіти на email</SettingDescription>
              </SettingInfo>
              <Toggle enabled />
            </SettingItem>

            <SettingItem>
              <SettingInfo>
                <SettingLabel>Push-сповіщення</SettingLabel>
                <SettingDescription>Сповіщення у браузері</SettingDescription>
              </SettingInfo>
              <Toggle />
            </SettingItem>

            <SettingItem>
              <SettingInfo>
                <SettingLabel>Звукові сповіщення</SettingLabel>
                <SettingDescription>Звук при новому замовленні</SettingDescription>
              </SettingInfo>
              <Toggle enabled />
            </SettingItem>
          </SettingsSection>

          <SettingsSection>
            <SectionTitle>Безпека</SectionTitle>
            <SectionDescription>Параметри безпеки облікового запису</SectionDescription>

            <SettingItem>
              <SettingInfo>
                <SettingLabel>Змінити пароль</SettingLabel>
                <SettingDescription>Рекомендуємо оновлювати пароль регулярно</SettingDescription>
              </SettingInfo>
              <Button>Змінити</Button>
            </SettingItem>

            <SettingItem>
              <SettingInfo>
                <SettingLabel>Двофакторна автентифікація</SettingLabel>
                <SettingDescription>Додатковий захист облікового запису</SettingDescription>
              </SettingInfo>
              <Button>Налаштувати</Button>
            </SettingItem>

            <SettingItem>
              <SettingInfo>
                <SettingLabel>Активні сесії</SettingLabel>
                <SettingDescription>Перегляд та керування активними сесіями</SettingDescription>
              </SettingInfo>
              <Button>Переглянути</Button>
            </SettingItem>
          </SettingsSection>
        </SettingsContent>
      </SettingsGrid>
    </MainLayout>
  );
}
