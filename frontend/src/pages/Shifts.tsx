import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Clock,
  Play,
  Square,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { openShift, closeShift, fetchShiftHistory } from '../store/slices/shiftSlice';
import { theme } from '../styles/GlobalStyles';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Styled Components
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

const CurrentShiftCard = styled.div<{ isOpen?: boolean }>`
  background: ${props => props.isOpen ? theme.colors.successLight : theme.colors.gray50};
  border: 2px solid ${props => props.isOpen ? theme.colors.success : theme.colors.border};
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
`;

const ShiftHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ShiftStatus = styled.div<{ isOpen?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.isOpen ? theme.colors.success : theme.colors.textSecondary};

  svg {
    padding: 8px;
    background: ${props => props.isOpen ? theme.colors.success : theme.colors.gray300};
    color: white;
    border-radius: 50%;
  }
`;

const ShiftActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ShiftButton = styled.button<{ variant?: 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  background: ${props => {
    switch (props.variant) {
      case 'success': return theme.colors.success;
      case 'danger': return theme.colors.danger;
      default: return theme.colors.primary;
    }
  }};
  color: white;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const ShiftStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
`;

const StatBox = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const HistorySection = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  overflow: hidden;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const ShiftList = styled.div``;

const ShiftItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${theme.colors.gray50};
  }
`;

const ShiftInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ShiftIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ShiftDetails = styled.div``;

const ShiftNumber = styled.div`
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const ShiftMeta = styled.div`
  font-size: 13px;
  color: ${theme.colors.textMuted};
`;

const ShiftAmount = styled.div`
  text-align: right;
`;

const AmountValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.colors.success};
`;

const AmountLabel = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 400px;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  font-size: 15px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  background: ${props => props.variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${props => props.variant === 'primary' ? 'white' : theme.colors.textPrimary};
  border: 1px solid ${props => props.variant === 'primary' ? theme.colors.primary : theme.colors.border};

  &:hover {
    background: ${props => props.variant === 'primary' ? theme.colors.primaryHover : theme.colors.gray100};
  }
`;

// Component
export default function Shifts() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { currentShift, shiftHistory, isLoading } = useAppSelector(state => state.shift);
  const { selectedStore, selectedRegister, accounts } = useAppSelector(state => state.data);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [cashStart, setCashStart] = useState('0');
  const [cashEnd, setCashEnd] = useState('0');

  useEffect(() => {
    if (user) {
      dispatch(fetchShiftHistory({ companyId: user._client }));
    }
  }, [dispatch, user]);

  const formatPrice = (price: number) => price.toFixed(2) + ' ₴';

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'dd MMM yyyy, HH:mm', { locale: uk });
  };

  const handleOpenShift = async () => {
    if (!user || !selectedStore || !selectedRegister) {
      toast.error('Оберіть магазин та касу');
      return;
    }

    const result = await dispatch(openShift({
      companyId: user._client,
      registerId: selectedRegister._id,
      storeId: selectedStore._id,
      accountId: accounts[0]?._id,
      cashStart: parseFloat(cashStart) || 0,
    }));

    if (openShift.fulfilled.match(result)) {
      toast.success('Зміну відкрито');
      setShowOpenModal(false);
      setCashStart('0');
    }
  };

  const handleCloseShift = async () => {
    if (!user || !currentShift) return;

    const result = await dispatch(closeShift({
      companyId: user._client,
      shiftId: currentShift._id,
      cashEnd: parseFloat(cashEnd) || 0,
    }));

    if (closeShift.fulfilled.match(result)) {
      toast.success('Зміну закрито');
      setShowCloseModal(false);
      setCashEnd('0');
    }
  };

  return (
    <MainLayout title="Зміни">
      <PageHeader>
        <PageTitle>Управління змінами</PageTitle>
      </PageHeader>

      <CurrentShiftCard isOpen={!!currentShift}>
        <ShiftHeader>
          <ShiftStatus isOpen={!!currentShift}>
            <Clock size={24} />
            {currentShift ? `Зміна #${currentShift.number} відкрита` : 'Зміна закрита'}
          </ShiftStatus>
          <ShiftActions>
            {currentShift ? (
              <ShiftButton variant="danger" onClick={() => setShowCloseModal(true)}>
                <Square size={18} />
                Закрити зміну
              </ShiftButton>
            ) : (
              <ShiftButton variant="success" onClick={() => setShowOpenModal(true)}>
                <Play size={18} />
                Відкрити зміну
              </ShiftButton>
            )}
          </ShiftActions>
        </ShiftHeader>

        {currentShift && (
          <ShiftStats>
            <StatBox>
              <StatValue>{formatPrice(currentShift.cash_start)}</StatValue>
              <StatLabel>Каса на початок</StatLabel>
            </StatBox>
            <StatBox>
              <StatValue>{currentShift.sales_count}</StatValue>
              <StatLabel>Продажів</StatLabel>
            </StatBox>
            <StatBox>
              <StatValue>{formatPrice(currentShift.sales_total)}</StatValue>
              <StatLabel>Сума продажів</StatLabel>
            </StatBox>
            <StatBox>
              <StatValue>{formatPrice(currentShift.cash_start + currentShift.sales_total)}</StatValue>
              <StatLabel>Очікувана каса</StatLabel>
            </StatBox>
          </ShiftStats>
        )}
      </CurrentShiftCard>

      <HistorySection>
        <SectionTitle>Історія змін</SectionTitle>
        <ShiftList>
          {shiftHistory.length > 0 ? (
            shiftHistory.map(shift => (
              <ShiftItem key={shift._id}>
                <ShiftInfo>
                  <ShiftIcon>
                    <Clock size={20} />
                  </ShiftIcon>
                  <ShiftDetails>
                    <ShiftNumber>Зміна #{shift.number}</ShiftNumber>
                    <ShiftMeta>
                      {formatDate(shift.opened)} – {shift.closed ? formatDate(shift.closed) : 'Відкрита'}
                    </ShiftMeta>
                  </ShiftDetails>
                </ShiftInfo>
                <ShiftAmount>
                  <AmountValue>{formatPrice(shift.sales_total)}</AmountValue>
                  <AmountLabel>{shift.sales_count} продажів</AmountLabel>
                </ShiftAmount>
              </ShiftItem>
            ))
          ) : (
            <ShiftItem>
              <ShiftInfo>
                <AlertCircle size={20} color={theme.colors.textMuted} />
                <ShiftMeta>Історія змін порожня</ShiftMeta>
              </ShiftInfo>
            </ShiftItem>
          )}
        </ShiftList>
      </HistorySection>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <Modal onClick={() => setShowOpenModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Відкрити зміну</ModalTitle>
            <FormGroup>
              <Label>Каса на початок зміни</Label>
              <Input
                type="number"
                value={cashStart}
                onChange={(e) => setCashStart(e.target.value)}
                placeholder="0.00"
              />
            </FormGroup>
            <FormGroup>
              <Label>Магазин</Label>
              <Input type="text" value={selectedStore?.name || '-'} disabled />
            </FormGroup>
            <FormGroup>
              <Label>Каса</Label>
              <Input type="text" value={selectedRegister?.name || '-'} disabled />
            </FormGroup>
            <ModalButtons>
              <Button onClick={() => setShowOpenModal(false)}>Скасувати</Button>
              <Button variant="primary" onClick={handleOpenShift} disabled={isLoading}>
                {isLoading ? 'Відкриваємо...' : 'Відкрити'}
              </Button>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && currentShift && (
        <Modal onClick={() => setShowCloseModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Закрити зміну #{currentShift.number}</ModalTitle>
            <FormGroup>
              <Label>Фактична каса</Label>
              <Input
                type="number"
                value={cashEnd}
                onChange={(e) => setCashEnd(e.target.value)}
                placeholder="0.00"
              />
            </FormGroup>
            <FormGroup>
              <Label>Очікувана каса</Label>
              <Input
                type="text"
                value={formatPrice(currentShift.cash_start + currentShift.sales_total)}
                disabled
              />
            </FormGroup>
            <ModalButtons>
              <Button onClick={() => setShowCloseModal(false)}>Скасувати</Button>
              <Button variant="primary" onClick={handleCloseShift} disabled={isLoading}>
                {isLoading ? 'Закриваємо...' : 'Закрити зміну'}
              </Button>
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}
    </MainLayout>
  );
}
