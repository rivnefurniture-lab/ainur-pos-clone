import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Clock,
  Check,
  X,
  ChevronDown,
  Settings,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchShiftHistory } from '../store/slices/shiftSlice';
import { documentApi } from '../services/api';
import { theme } from '../styles/GlobalStyles';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Document, Shift } from '../types';

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

const FilterDropdown = styled.div`
  position: relative;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 13px;
  color: ${theme.colors.textSecondary};
  min-width: 120px;
  
  span {
    color: ${theme.colors.textPrimary};
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
  min-width: 200px;
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
  margin-left: -4px;
  color: ${theme.colors.textMuted};
  padding: 4px;
  &:hover {
    color: ${theme.colors.textPrimary};
  }
`;

const SettingsButton = styled.button`
  margin-left: auto;
  padding: 8px;
  border-radius: 4px;
  color: ${theme.colors.textMuted};
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
  min-width: 1100px;
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

const StatusIcon = styled.span<{ open?: boolean }>`
  display: inline-flex;
  color: ${props => props.open ? theme.colors.warning : theme.colors.success};
`;

const ShiftLink = styled.span`
  color: ${theme.colors.primary};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const CashierLink = styled.span`
  color: ${theme.colors.primary};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
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

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const PanelTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px;
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
  text-align: right;
`;

const InfoList = styled.div`
  margin-bottom: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoIcon = styled.span`
  color: ${theme.colors.primary};
`;

const InfoText = styled.span``;

const InfoLink = styled.a`
  color: ${theme.colors.primary};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${theme.colors.textSecondary};
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 20px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
`;

const StatLabel = styled.span`
  color: ${theme.colors.textSecondary};
`;

const StatValue = styled.span<{ color?: string }>`
  font-weight: 500;
  color: ${props => props.color || theme.colors.textPrimary};
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  font-size: 18px;
  font-weight: 600;
  border-top: 1px solid ${theme.colors.border};
  margin-top: 16px;
`;

const DateGroupTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
  padding: 16px 0 8px;
`;

// ============================================
// Component
// ============================================
export default function Shifts() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { shiftHistory } = useAppSelector(state => state.shift);
  const { stores, registers } = useAppSelector(state => state.data);

  const [dateFrom, setDateFrom] = useState(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState(new Date());
  const [cashierFilter, setCashierFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [registerFilter, setRegisterFilter] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchShiftHistory({ companyId: user._client }));
    }
  }, [dispatch, user]);

  const formatPrice = (price: number) => {
    const parts = (price || 0).toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join(',');
  };

  const formatDateTime = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'd MMMM HH:mm', { locale: ru });
  };

  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'HH:mm');
  };

  // Extract unique cashiers from shift history
  const cashiers = Array.from(new Set(shiftHistory.map(s => s.cashier_name).filter(Boolean)));

  // Filter shifts
  const filteredShifts = shiftHistory.filter(shift => {
    const shiftDate = new Date(shift.opened * 1000);
    if (shiftDate < dateFrom || shiftDate > dateTo) return false;
    if (cashierFilter && shift.cashier_name !== cashierFilter) return false;
    if (storeFilter && shift.store_name !== storeFilter) return false;
    if (registerFilter && shift.register_name !== registerFilter) return false;
    return true;
  });

  // Group by date
  const groupedShifts = filteredShifts.reduce((groups, shift) => {
    const date = format(new Date(shift.opened * 1000), 'd MMMM yyyy', { locale: ru });
    if (!groups[date]) groups[date] = [];
    groups[date].push(shift);
    return groups;
  }, {} as Record<string, Shift[]>);

  const openShiftPanel = (shift: Shift) => {
    setSelectedShift(shift);
  };

  const closePanel = () => {
    setSelectedShift(null);
  };

  return (
    <MainLayout title="Зміни">
      <PageContainer>
        <TopBar>
          <FilterDropdown>
            <FilterButton onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}>
              дата відкриття
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
            <FilterButton onClick={() => setOpenDropdown(openDropdown === 'cashier' ? null : 'cashier')}>
              касир
              <span>{cashierFilter || 'введіть'}</span>
              {cashierFilter && (
                <ClearFilter onClick={(e) => { e.stopPropagation(); setCashierFilter(''); }}>
                  <X size={14} />
                </ClearFilter>
              )}
            </FilterButton>
            <FilterMenu isOpen={openDropdown === 'cashier'}>
              {cashiers.map(name => (
                <FilterOption key={name} onClick={() => { setCashierFilter(name || ''); setOpenDropdown(null); }}>
                  {name}
                </FilterOption>
              ))}
            </FilterMenu>
          </FilterDropdown>

          <FilterDropdown>
            <FilterButton onClick={() => setOpenDropdown(openDropdown === 'store' ? null : 'store')}>
              магазин
              <span>{storeFilter || 'введіть'}</span>
              {storeFilter && (
                <ClearFilter onClick={(e) => { e.stopPropagation(); setStoreFilter(''); }}>
                  <X size={14} />
                </ClearFilter>
              )}
            </FilterButton>
            <FilterMenu isOpen={openDropdown === 'store'}>
              {stores.map(store => (
                <FilterOption key={store._id} onClick={() => { setStoreFilter(store.name); setOpenDropdown(null); }}>
                  {store.name}
                </FilterOption>
              ))}
            </FilterMenu>
          </FilterDropdown>

          <FilterDropdown>
            <FilterButton onClick={() => setOpenDropdown(openDropdown === 'register' ? null : 'register')}>
              каса
              <span>{registerFilter || 'введіть'}</span>
              {registerFilter && (
                <ClearFilter onClick={(e) => { e.stopPropagation(); setRegisterFilter(''); }}>
                  <X size={14} />
                </ClearFilter>
              )}
            </FilterButton>
            <FilterMenu isOpen={openDropdown === 'register'}>
              {registers.map(reg => (
                <FilterOption key={reg._id} onClick={() => { setRegisterFilter(reg.name); setOpenDropdown(null); }}>
                  {reg.name}
                </FilterOption>
              ))}
            </FilterMenu>
          </FilterDropdown>

          <SettingsButton>
            <Settings size={18} />
          </SettingsButton>
        </TopBar>

        <TableContainer>
          <Table>
            <Thead>
              <tr>
                <Th>СТАТУС</Th>
                <Th>НОМЕР</Th>
                <Th>ВІДКРИТА</Th>
                <Th>ЗАКРИТА</Th>
                <Th>КАСИР</Th>
                <Th>КАСА</Th>
                <Th>МАГАЗИН</Th>
                <Th>ВИРУЧКА ГРН</Th>
                <Th>ПРОДАЖІ</Th>
              </tr>
            </Thead>
            <tbody>
              {Object.entries(groupedShifts).map(([date, shifts]) => (
                shifts.map((shift, idx) => (
                  <Tr key={shift._id} onClick={() => openShiftPanel(shift)}>
                    <Td>
                      <StatusIcon open={!shift.closed}>
                        {shift.closed ? <Check size={18} /> : <Clock size={18} />}
                      </StatusIcon>
                    </Td>
                    <Td>
                      <ShiftLink>Зміна #{shift.number}</ShiftLink>
                    </Td>
                    <Td>{formatDateTime(shift.opened)}</Td>
                    <Td>{shift.closed ? formatDateTime(shift.closed) : '—'}</Td>
                    <Td>
                      <CashierLink>{shift.cashier_name || '—'}</CashierLink>
                    </Td>
                    <Td>
                      <CashierLink>{shift.register_name || '—'}</CashierLink>
                    </Td>
                    <Td>
                      <CashierLink>{shift.store_name || '—'}</CashierLink>
                    </Td>
                    <Td>{formatPrice(shift.sales_total)}</Td>
                    <Td>{shift.sales_count}</Td>
                  </Tr>
                ))
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </PageContainer>

      {/* Overlay */}
      <PanelOverlay isOpen={selectedShift !== null} onClick={closePanel} />

      {/* Shift Detail Panel */}
      <SlidePanel isOpen={selectedShift !== null}>
        {selectedShift && (
          <>
            <PanelHeader>
              <PanelCloseButton onClick={closePanel}>
                <X size={20} />
              </PanelCloseButton>
            </PanelHeader>
            <PanelContent>
              <PanelTitle>Зміна #{selectedShift.number}</PanelTitle>
              <PanelSubtitle>
                Створено {format(new Date(selectedShift.opened * 1000), 'd MMMM', { locale: ru })}
              </PanelSubtitle>
              <PanelLabel>Зміна</PanelLabel>

              <InfoList>
                <InfoItem>
                  <InfoIcon>●</InfoIcon>
                  <InfoText>Відкрита {formatDateTime(selectedShift.opened)}</InfoText>
                </InfoItem>
                {selectedShift.closed && (
                  <InfoItem>
                    <InfoIcon>●</InfoIcon>
                    <InfoText>Закрита {formatDateTime(selectedShift.closed)}</InfoText>
                  </InfoItem>
                )}
                <InfoItem>
                  <InfoIcon>●</InfoIcon>
                  <InfoText>Магазин «{selectedShift.store_name || '—'}»</InfoText>
                </InfoItem>
                <InfoItem>
                  <InfoIcon>●</InfoIcon>
                  <InfoText>Каса «{selectedShift.register_name || '—'}»</InfoText>
                </InfoItem>
              </InfoList>

              <div style={{ display: 'flex', gap: 40, marginBottom: 24 }}>
                <div style={{ textAlign: 'right', flex: 1 }}>
                  <InfoLink>{selectedShift.cashier_name || '—'}</InfoLink>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Android 11</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>IP 10.0.10.206</div>
                </div>
              </div>

              <SectionTitle>ВИРУЧКА</SectionTitle>
              <StatGrid>
                <StatRow>
                  <StatLabel>Кіл-во продажів</StatLabel>
                  <StatValue>{selectedShift.sales_count}</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Готівка</StatLabel>
                  <StatValue>{formatPrice(selectedShift.sales_total * 0.3)} грн</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Сума продажів</StatLabel>
                  <StatValue>{formatPrice(selectedShift.sales_total)} грн</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Безготівка</StatLabel>
                  <StatValue>{formatPrice(selectedShift.sales_total * 0.7)} грн</StatValue>
                </StatRow>
              </StatGrid>

              <SectionTitle>ПОВЕРНЕННЯ</SectionTitle>
              <StatGrid>
                <StatRow>
                  <StatLabel>Кількість повернень продажів</StatLabel>
                  <StatValue>0</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Готівка</StatLabel>
                  <StatValue>0,00 грн</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Сума повернень продажів</StatLabel>
                  <StatValue>0,00 грн</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Безготівка</StatLabel>
                  <StatValue>0,00 грн</StatValue>
                </StatRow>
              </StatGrid>

              <SectionTitle>КАСА</SectionTitle>
              <StatGrid>
                <StatRow>
                  <StatLabel>Сума на початок зміни</StatLabel>
                  <StatValue>{formatPrice(selectedShift.cash_start)} грн</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Сума всіх внесень</StatLabel>
                  <StatValue>{formatPrice(selectedShift.sales_total * 0.3)} грн</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Сума на кінець зміни</StatLabel>
                  <StatValue>{formatPrice(selectedShift.cash_end || 0)} грн</StatValue>
                </StatRow>
                <StatRow>
                  <StatLabel>Сума расходів</StatLabel>
                  <StatValue>{formatPrice(selectedShift.sales_total * 0.3)} грн</StatValue>
                </StatRow>
              </StatGrid>

              <TotalRow>
                <span>Виручка</span>
                <StatValue color={theme.colors.success}>{formatPrice(selectedShift.sales_total)} грн</StatValue>
              </TotalRow>
            </PanelContent>
          </>
        )}
      </SlidePanel>
    </MainLayout>
  );
}
