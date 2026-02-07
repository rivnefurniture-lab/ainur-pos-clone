import { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import {
  Search,
  X,
  Check,
  ChevronDown,
  Filter,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Printer,
  Download,
  RotateCcw,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppSelector } from '../hooks/useRedux';
import { documentApi, dataApi } from '../services/api';
import type { Document, Store, Customer } from '../types';
import { theme } from '../styles/GlobalStyles';
import { format } from 'date-fns';
import { uk, ru } from 'date-fns/locale';

// ============================================
// Types
// ============================================
interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  created?: number;
}

interface DocumentFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  payment: string;
  type: string;
  author: string;
  fiscalCheck: string;
  orderStatus: string;
  receiver: string;
  sender: string;
}

interface UserOption {
  _id: string;
  name: string;
  role?: string;
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

const FiltersBar = styled.div`
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
  min-width: 200px;

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
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  color: ${props => props.hasValue ? theme.colors.textPrimary : '#9ca3af'};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: #9ca3af;
  }

  svg {
    color: #9ca3af;
  }
`;

const FilterMenu = styled.div<{ isOpen: boolean; $flexLayout?: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 180px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 100;
  display: ${props => props.isOpen ? (props.$flexLayout ? 'flex' : 'block') : 'none'};
  flex-direction: ${props => props.$flexLayout ? 'column' : 'initial'};
`;

const FilterOption = styled.div<{ active?: boolean }>`
  padding: 10px 14px;
  font-size: 14px;
  cursor: pointer;
  background: ${props => props.active ? '#f0f7ff' : 'white'};
  color: ${props => props.active ? theme.colors.primary : theme.colors.textPrimary};

  &:hover {
    background: #f5f5f5;
  }
`;

const ClearFilterButton = styled.button`
  padding: 0 4px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    color: #666;
  }
`;

const FilterBadge = styled.div`
  position: relative;
`;

const FilterBadgeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  cursor: pointer;

  &:hover {
    border-color: #9ca3af;
  }

  svg {
    color: #9ca3af;
  }
`;

const FilterBadgeMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 180px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 100;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const DatePresetList = styled.div`
  border-right: 1px solid ${theme.colors.border};
  min-width: 140px;
`;

const DatePresetItem = styled.div<{ active?: boolean }>`
  padding: 10px 14px;
  font-size: 14px;
  cursor: pointer;
  background: ${props => props.active ? '#f0f7ff' : 'white'};
  color: ${theme.colors.textPrimary};

  &:hover {
    background: #f5f5f5;
  }
`;

const DateCalendars = styled.div`
  display: flex;
  gap: 24px;
  padding: 16px;
`;

const CalendarContainer = styled.div`
  width: 280px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 13px;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

const CalendarDay = styled.div<{ isCurrentMonth?: boolean; isSelected?: boolean; isInRange?: boolean; isToday?: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  color: ${props => {
    if (!props.isCurrentMonth) return '#d1d5db';
    if (props.isSelected) return 'white';
    return theme.colors.textPrimary;
  }};
  background: ${props => {
    if (props.isSelected) return theme.colors.primary;
    if (props.isInRange) return '#dbeafe';
    return 'transparent';
  }};
  border: ${props => props.isToday ? `1px solid ${theme.colors.primary}` : 'none'};

  &:hover {
    background: ${props => props.isSelected ? theme.colors.primary : '#f3f4f6'};
  }
`;

const DateRangeInfo = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
`;

const ApplyButton = styled.button`
  padding: 8px 16px;
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: ${theme.colors.primaryHover};
  }
`;

const FilterGroupTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  background: #f9fafb;
`;

const OrderStatusDot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const LegacyFilterBadge = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  cursor: pointer;

  svg {
    color: #9ca3af;
  }
`;

const TableContainer = styled.div`
  flex: 1;
  overflow: auto;
  background: white;
  border-radius: 4px;
  border: 1px solid ${theme.colors.border};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Thead = styled.thead`
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 10;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  color: #6b7280;
  border-bottom: 1px solid ${theme.colors.border};
  white-space: nowrap;
`;

const DateHeader = styled.tr`
  background: #f8f9fa;
  td {
    padding: 12px 16px;
    font-weight: 600;
    color: ${theme.colors.textPrimary};
    border-bottom: 1px solid ${theme.colors.border};
  }
`;

const Tr = styled.tr`
  &:hover {
    background: #f8fafc;
  }
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
`;

const StatusCheck = styled.div<{ checked?: boolean }>`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.checked ? '#10b981' : '#d1d5db'};
`;

const DocLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  font-weight: 500;
  cursor: pointer;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }
`;

const StoreLink = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.primary};
  cursor: pointer;
  text-align: left;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;

const PaidCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DiscountBadge = styled.span`
  color: #ef4444;
  font-size: 12px;
`;

// ============================================
// Slide Panel Styles
// ============================================
const SlidePanel = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 600px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0,0,0,0.1);
  z-index: 1000;
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const PanelOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 999;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const PanelActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PanelButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;

  ${props => {
    if (props.variant === 'primary') {
      return `
        background: #10b981;
        color: white;
        &:hover { background: #059669; }
      `;
    }
    if (props.variant === 'danger') {
      return `
        background: white;
        color: #ef4444;
        border: 1px solid #ef4444;
        &:hover { background: #fef2f2; }
      `;
    }
    return `
      background: white;
      color: ${theme.colors.textPrimary};
      border: 1px solid ${theme.colors.border};
      &:hover { background: #f5f5f5; }
    `;
  }}
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #f5f5f5;
  }
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const PanelTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px;
  color: ${theme.colors.textPrimary};
`;

const PanelSubtitle = styled.div`
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const PanelType = styled.span`
  color: #9ca3af;
  font-size: 14px;
`;

const Badge = styled.span<{ color?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  background: ${props => props.color || '#10b981'};
  color: white;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 32px;
  margin: 20px 0;
`;

const InfoItem = styled.div``;

const InfoLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  font-weight: 500;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  text-align: center;
  margin: 24px 0 16px;
`;

const PaymentTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
`;

const PaymentTh = styled.th`
  text-align: left;
  padding: 10px 12px;
  font-size: 13px;
  color: #6b7280;
  border-bottom: 1px solid ${theme.colors.border};
`;

const PaymentTd = styled.td`
  padding: 12px;
  font-size: 14px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const ProductsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const ProductTh = styled.th`
  text-align: left;
  padding: 10px 8px;
  font-size: 13px;
  color: #6b7280;
  border-bottom: 1px solid ${theme.colors.border};
  white-space: nowrap;

  &:last-child {
    text-align: right;
  }
`;

const ProductTd = styled.td`
  padding: 10px 8px;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    text-align: right;
  }
`;

const ProductName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProductColor = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const TotalRow = styled.tr`
  font-weight: 600;
  td {
    padding: 12px 8px;
    border-top: 2px solid ${theme.colors.border};
  }
`;

// Store/Client/User Panel Styles
const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${theme.colors.primary};

  svg {
    color: #6b7280;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 24px 0 16px;
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 8px 16px;
  background: ${props => props.active ? '#f0f7ff' : 'white'};
  border: 1px solid ${props => props.active ? theme.colors.primary : theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
  color: ${props => props.active ? theme.colors.primary : theme.colors.textPrimary};
  cursor: pointer;

  &:hover {
    background: ${props => props.active ? '#f0f7ff' : '#f5f5f5'};
  }
`;

const OperationCard = styled.div`
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
`;

const OperationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const OperationTitle = styled.div`
  color: ${theme.colors.primary};
  font-weight: 500;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const OperationAmount = styled.div`
  text-align: right;
`;

const OperationMeta = styled.div`
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OperationStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #10b981;
  margin-top: 8px;
`;

const OperationExpand = styled.div`
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    color: ${theme.colors.textPrimary};
  }
`;

// ============================================
// Component
// ============================================
export default function Documents() {
  const { user } = useAppSelector(state => state.auth);
  const companyId = user?._client || '58c872aa3ce7d5fc688b49bd';

  // Data state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    payment: '',
    type: '',
    author: '',
    fiscalCheck: '',
    orderStatus: '',
    receiver: '',
    sender: '',
  });
  
  // Active additional filters
  const [activeExtraFilters, setActiveExtraFilters] = useState<string[]>([]);
  
  // Users list for author filter
  const [users, setUsers] = useState<UserOption[]>([]);
  
  // Suppliers list
  const [suppliers, setSuppliers] = useState<{_id: string; name: string}[]>([]);

  // Dropdown state
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Panel state
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [panelType, setPanelType] = useState<'doc' | 'store' | 'customer' | 'user' | null>(null);

  // Date range state - default to last week
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [dateTo, setDateTo] = useState(() => new Date());

  // Load data
  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, filters.type]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Use selected date range
      const from = Math.floor(new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate(), 0, 0, 0).getTime() / 1000);
      const to = Math.floor(new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59).getTime() / 1000);

      const searchFilters: any = { from, to };
      if (filters.type) {
        searchFilters.type = filters.type;
      }

      const [docsResponse, storesResponse, customersResponse] = await Promise.all([
        documentApi.searchDocuments(companyId, searchFilters, 0, 1000),
        dataApi.getStores(companyId),
        dataApi.getCustomers(companyId, 0, 1000),
      ]);

      if (docsResponse.status && docsResponse.data) {
        setDocuments(docsResponse.data);
        
        // Extract unique users from documents
        const userMap = new Map<string, UserOption>();
        docsResponse.data.forEach((doc: Document) => {
          if (doc._user && doc.author_name) {
            userMap.set(doc._user, {
              _id: doc._user,
              name: doc.author_name,
              role: 'Кассир', // Default role, could be extracted from doc if available
            });
          }
        });
        setUsers(Array.from(userMap.values()));
      }
      if (storesResponse.status && storesResponse.data) {
        setStores(storesResponse.data);
      }
      if (customersResponse.status && customersResponse.data) {
        setCustomers(customersResponse.data);
      }
      
      // Fetch suppliers
      try {
        const suppliersResponse = await dataApi.getSuppliers(companyId);
        if (suppliersResponse.status && suppliersResponse.data) {
          setSuppliers(suppliersResponse.data);
        }
      } catch (e) {
        console.error('Failed to load suppliers:', e);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date range for display
  const formatDateRange = () => {
    const fromStr = format(dateFrom, 'd MMM', { locale: ru });
    const toStr = format(dateTo, 'd MMM', { locale: ru });
    return `${fromStr} — ${toStr}`;
  };

  // Filter documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!doc.number?.toString().includes(search)) return false;
      }
      if (filters.type && doc.type !== filters.type) return false;
      if (filters.status) {
        // Filter by status
      }
      return true;
    });
  }, [documents, filters]);

  // Group documents by date
  const groupedDocs = useMemo(() => {
    const groups: Record<string, Document[]> = {};
    filteredDocs.forEach(doc => {
      const date = format(new Date((doc.date || 0) * 1000), 'd MMMM', { locale: ru });
      if (!groups[date]) groups[date] = [];
      groups[date].push(doc);
    });
    return groups;
  }, [filteredDocs]);

  // Helpers
  const getStoreName = (storeId: string) => {
    const store = stores.find(s => s._id === storeId);
    return store?.name || storeId;
  };

  const getStore = (storeId: string) => stores.find(s => s._id === storeId);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c._id === customerId);
    return customer?.name || 'Роздрібний покупець';
  };

  const getCustomer = (customerId: string) => customers.find(c => c._id === customerId);

  const formatTime = (timestamp: number) => format(new Date(timestamp * 1000), 'HH:mm');
  
  const formatDate = (timestamp: number) => format(new Date(timestamp * 1000), 'd MMMM yyyy', { locale: ru });

  const formatPrice = (price: number) => {
    const parts = price.toFixed(2).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const getDocTypeName = (type: string) => {
    const types: Record<string, string> = {
      'sales': 'Продажа',
      'sale': 'Продажа',
      'purchases': 'Закупка',
      'purchase': 'Закупка',
      'return_sales': 'Возврат продажи',
      'return_purchases': 'Возврат закупки',
      'movements': 'Перемещение',
      'movement': 'Перемещение',
      'changes': 'Корректировка',
      'inventory': 'Инвентаризация',
    };
    return types[type] || type;
  };

  const getProductColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  // Panel handlers
  const openDocPanel = (doc: Document) => {
    setSelectedDoc(doc);
    setPanelType('doc');
  };

  const openStorePanel = (storeId: string) => {
    const store = getStore(storeId);
    if (store) {
      setSelectedStore(store);
      setPanelType('store');
    }
  };

  const openCustomerPanel = (customerId: string) => {
    const customer = getCustomer(customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setPanelType('customer');
    }
  };

  const openUserPanel = (userId: string, userName: string) => {
    setSelectedUser({
      _id: userId,
      name: userName,
      email: 'o_kytsuk@mail.ru',
      phone: '380939713320',
      role: 'Владелец',
      created: 1489579200,
    });
    setPanelType('user');
  };

  const closePanel = () => {
    setPanelType(null);
    setSelectedDoc(null);
    setSelectedStore(null);
    setSelectedCustomer(null);
    setSelectedUser(null);
  };

  // Filter type options - matching Ainur exactly
  const typeOptions = [
    { value: 'sales', label: 'Продажа' },
    { value: 'purchases', label: 'Закупка' },
    { value: 'return_sales', label: 'Возврат продажи' },
    { value: 'return_purchases', label: 'Возврат закупки' },
    { value: 'changes', label: 'Корректировка' },
    { value: 'inventory', label: 'Инвентаризация' },
    { value: 'arrivals', label: 'Оприходование' },
    { value: 'writeoffs', label: 'Списание' },
    { value: 'movements', label: 'Перемещение' },
  ];

  const statusOptions = [
    { value: 'completed', label: 'Проведён' },
    { value: 'pending', label: 'Отложен' },
    { value: 'deleted', label: 'Удалён' },
  ];

  const paymentOptions = [
    { value: 'paid', label: 'Оплаченные' },
    { value: 'unpaid', label: 'Неоплаченные' },
  ];
  
  const orderStatusOptions = [
    { value: 'new', label: 'Новый', color: '#6b7280' },
    { value: 'in_progress', label: 'В работе', color: '#3b82f6' },
    { value: 'closed', label: 'Закрыт', color: '#10b981' },
    { value: 'cancelled', label: 'Отменён', color: '#ef4444' },
  ];
  
  const fiscalOptions = [
    { value: 'yes', label: 'Да' },
    { value: 'no', label: 'Нет' },
  ];
  
  const extraFilterOptions = [
    { value: 'author', label: 'Автор' },
    { value: 'fiscalCheck', label: 'Фискальный чек' },
    { value: 'orderStatus', label: 'Статус заказа' },
    { value: 'receiver', label: 'Получатель' },
    { value: 'sender', label: 'Отправитель' },
    { value: 'type', label: 'Тип' },
  ];
  
  const datePresets = [
    { label: 'сегодня', getValue: () => { const d = new Date(); return { from: d, to: d }; } },
    { label: 'Вчера', getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { from: d, to: d }; } },
    { label: '7 дней', getValue: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 7); return { from, to }; } },
    { label: '30 дней', getValue: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 30); return { from, to }; } },
    { label: 'Этот месяц', getValue: () => { const now = new Date(); return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }; } },
    { label: 'Прошлый месяц', getValue: () => { const now = new Date(); return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) }; } },
    { label: 'квартал', getValue: () => { const now = new Date(); const qm = Math.floor(now.getMonth() / 3) * 3; return { from: new Date(now.getFullYear(), qm, 1), to: now }; } },
  ];
  
  // Add extra filter
  const addExtraFilter = (filterKey: string) => {
    if (!activeExtraFilters.includes(filterKey)) {
      setActiveExtraFilters([...activeExtraFilters, filterKey]);
    }
    setOpenDropdown(null);
  };
  
  // Remove extra filter
  const removeExtraFilter = (filterKey: string) => {
    setActiveExtraFilters(activeExtraFilters.filter(f => f !== filterKey));
    setFilters({ ...filters, [filterKey]: '' });
  };

  // Get recent docs for store
  const getStoreRecentDocs = (storeId: string) => {
    return documents.filter(d => d._store === storeId).slice(0, 10);
  };

  // Get recent docs for customer
  const getCustomerRecentDocs = (customerId: string) => {
    return documents.filter(d => d._customer === customerId).slice(0, 10);
  };

  return (
    <MainLayout title="Движение товара">
      <PageContainer>
        <FiltersBar ref={filtersRef}>
          <SearchInput>
            <Search size={16} color="#9ca3af" />
            <input
              placeholder="поиск по номеру или комментарию"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </SearchInput>

          <FilterDropdown>
            <FilterButton hasValue onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}>
              дата
              <span style={{ color: theme.colors.textPrimary }}>
                {formatDateRange()}
              </span>
              {(dateFrom || dateTo) && (
                <ClearFilterButton onClick={(e) => { 
                  e.stopPropagation(); 
                  const d = new Date();
                  d.setDate(d.getDate() - 7);
                  setDateFrom(d);
                  setDateTo(new Date());
                }}>
                  <X size={14} />
                </ClearFilterButton>
              )}
            </FilterButton>
            <FilterMenu isOpen={openDropdown === 'date'} $flexLayout style={{ padding: 0, minWidth: 500 }}>
              <div style={{ display: 'flex' }}>
                <DatePresetList>
                  {datePresets.map(preset => (
                    <DatePresetItem 
                      key={preset.label}
                      onClick={() => {
                        const { from, to } = preset.getValue();
                        setDateFrom(from);
                        setDateTo(to);
                      }}
                    >
                      {preset.label}
                    </DatePresetItem>
                  ))}
                </DatePresetList>
                <div style={{ padding: 12, flex: 1 }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Від</label>
                      <input 
                        type="date" 
                        value={format(dateFrom, 'yyyy-MM-dd')}
                        onChange={(e) => setDateFrom(new Date(e.target.value))}
                        style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 4 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>До</label>
                      <input 
                        type="date" 
                        value={format(dateTo, 'yyyy-MM-dd')}
                        onChange={(e) => setDateTo(new Date(e.target.value))}
                        style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 4 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DateRangeInfo>
                <span>{format(dateFrom, 'yyyy-MM-dd')} to {format(dateTo, 'yyyy-MM-dd')} ({Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1} Дней)</span>
                <ApplyButton onClick={() => setOpenDropdown(null)}>Применить</ApplyButton>
              </DateRangeInfo>
            </FilterMenu>
          </FilterDropdown>

          <FilterDropdown>
            <FilterButton onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}>
              статус
              <span>{statusOptions.find(o => o.value === filters.status)?.label || 'Выберите'}</span>
              {filters.status && (
                <ClearFilterButton onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, status: '' }); }}>
                  <X size={14} />
                </ClearFilterButton>
              )}
            </FilterButton>
            <FilterMenu isOpen={openDropdown === 'status'}>
              {statusOptions.map(opt => (
                <FilterOption
                  key={opt.value}
                  active={filters.status === opt.value}
                  onClick={() => { setFilters({ ...filters, status: opt.value }); setOpenDropdown(null); }}
                >
                  {opt.label}
                </FilterOption>
              ))}
            </FilterMenu>
          </FilterDropdown>

          <FilterDropdown>
            <FilterButton onClick={() => setOpenDropdown(openDropdown === 'payment' ? null : 'payment')}>
              оплата
              <span>{paymentOptions.find(o => o.value === filters.payment)?.label || 'Выберите'}</span>
              {filters.payment && (
                <ClearFilterButton onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, payment: '' }); }}>
                  <X size={14} />
                </ClearFilterButton>
              )}
            </FilterButton>
            <FilterMenu isOpen={openDropdown === 'payment'}>
              {paymentOptions.map(opt => (
                <FilterOption
                  key={opt.value}
                  active={filters.payment === opt.value}
                  onClick={() => { setFilters({ ...filters, payment: opt.value }); setOpenDropdown(null); }}
                >
                  {opt.label}
                </FilterOption>
              ))}
            </FilterMenu>
          </FilterDropdown>

          <FilterDropdown>
            <FilterButton onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}>
              тип
              <span>{typeOptions.find(o => o.value === filters.type)?.label || 'введите'}</span>
              {filters.type && (
                <ClearFilterButton onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, type: '' }); }}>
                  <X size={14} />
                </ClearFilterButton>
              )}
            </FilterButton>
            <FilterMenu isOpen={openDropdown === 'type'}>
              {typeOptions.map(opt => (
                <FilterOption
                  key={opt.value}
                  active={filters.type === opt.value}
                  onClick={() => { setFilters({ ...filters, type: opt.value }); setOpenDropdown(null); }}
                >
                  {opt.label}
                </FilterOption>
              ))}
            </FilterMenu>
          </FilterDropdown>
          
          {/* Author filter - shown when active */}
          {activeExtraFilters.includes('author') && (
            <FilterDropdown>
              <FilterButton onClick={() => setOpenDropdown(openDropdown === 'author' ? null : 'author')}>
                автор
                <span>{users.find(u => u._id === filters.author)?.name || 'введите'}</span>
                <ClearFilterButton onClick={(e) => { e.stopPropagation(); removeExtraFilter('author'); }}>
                  <X size={14} />
                </ClearFilterButton>
              </FilterButton>
              <FilterMenu isOpen={openDropdown === 'author'} style={{ maxHeight: 300, overflow: 'auto' }}>
                <FilterGroupTitle>СОТРУДНИКИ</FilterGroupTitle>
                {users.map(user => (
                  <FilterOption
                    key={user._id}
                    active={filters.author === user._id}
                    onClick={() => { setFilters({ ...filters, author: user._id }); setOpenDropdown(null); }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span>{user.name}</span>
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>{user.role}</span>
                    </div>
                  </FilterOption>
                ))}
              </FilterMenu>
            </FilterDropdown>
          )}
          
          {/* Receiver filter */}
          {activeExtraFilters.includes('receiver') && (
            <FilterDropdown>
              <FilterButton onClick={() => setOpenDropdown(openDropdown === 'receiver' ? null : 'receiver')}>
                получатель
                <span>введите</span>
                <ClearFilterButton onClick={(e) => { e.stopPropagation(); removeExtraFilter('receiver'); }}>
                  <X size={14} />
                </ClearFilterButton>
              </FilterButton>
              <FilterMenu isOpen={openDropdown === 'receiver'} style={{ maxHeight: 300, overflow: 'auto' }}>
                <FilterGroupTitle>МАГАЗИНЫ</FilterGroupTitle>
                {stores.map(store => (
                  <FilterOption
                    key={store._id}
                    active={filters.receiver === store._id}
                    onClick={() => { setFilters({ ...filters, receiver: store._id }); setOpenDropdown(null); }}
                  >
                    {store.name}
                  </FilterOption>
                ))}
                <FilterGroupTitle>ПОСТАВЩИКИ</FilterGroupTitle>
                {suppliers.map(supplier => (
                  <FilterOption
                    key={supplier._id}
                    active={filters.receiver === supplier._id}
                    onClick={() => { setFilters({ ...filters, receiver: supplier._id }); setOpenDropdown(null); }}
                  >
                    {supplier.name}
                  </FilterOption>
                ))}
                <FilterGroupTitle>КЛИЕНТЫ</FilterGroupTitle>
                {customers.slice(0, 20).map(customer => (
                  <FilterOption
                    key={customer._id}
                    active={filters.receiver === customer._id}
                    onClick={() => { setFilters({ ...filters, receiver: customer._id }); setOpenDropdown(null); }}
                  >
                    {customer.name}
                  </FilterOption>
                ))}
              </FilterMenu>
            </FilterDropdown>
          )}
          
          {/* Sender filter */}
          {activeExtraFilters.includes('sender') && (
            <FilterDropdown>
              <FilterButton onClick={() => setOpenDropdown(openDropdown === 'sender' ? null : 'sender')}>
                отправитель
                <span>введите</span>
                <ClearFilterButton onClick={(e) => { e.stopPropagation(); removeExtraFilter('sender'); }}>
                  <X size={14} />
                </ClearFilterButton>
              </FilterButton>
              <FilterMenu isOpen={openDropdown === 'sender'} style={{ maxHeight: 300, overflow: 'auto' }}>
                <FilterGroupTitle>МАГАЗИНЫ</FilterGroupTitle>
                {stores.map(store => (
                  <FilterOption
                    key={store._id}
                    active={filters.sender === store._id}
                    onClick={() => { setFilters({ ...filters, sender: store._id }); setOpenDropdown(null); }}
                  >
                    {store.name}
                  </FilterOption>
                ))}
                <FilterGroupTitle>ПОСТАВЩИКИ</FilterGroupTitle>
                {suppliers.map(supplier => (
                  <FilterOption
                    key={supplier._id}
                    active={filters.sender === supplier._id}
                    onClick={() => { setFilters({ ...filters, sender: supplier._id }); setOpenDropdown(null); }}
                  >
                    {supplier.name}
                  </FilterOption>
                ))}
                <FilterGroupTitle>КЛИЕНТЫ</FilterGroupTitle>
                {customers.slice(0, 20).map(customer => (
                  <FilterOption
                    key={customer._id}
                    active={filters.sender === customer._id}
                    onClick={() => { setFilters({ ...filters, sender: customer._id }); setOpenDropdown(null); }}
                  >
                    {customer.name}
                  </FilterOption>
                ))}
              </FilterMenu>
            </FilterDropdown>
          )}
          
          {/* Order Status filter */}
          {activeExtraFilters.includes('orderStatus') && (
            <FilterDropdown>
              <FilterButton onClick={() => setOpenDropdown(openDropdown === 'orderStatus' ? null : 'orderStatus')}>
                статус заказа
                <span>{orderStatusOptions.find(o => o.value === filters.orderStatus)?.label || 'введите'}</span>
                <ClearFilterButton onClick={(e) => { e.stopPropagation(); removeExtraFilter('orderStatus'); }}>
                  <X size={14} />
                </ClearFilterButton>
              </FilterButton>
              <FilterMenu isOpen={openDropdown === 'orderStatus'}>
                {orderStatusOptions.map(opt => (
                  <FilterOption
                    key={opt.value}
                    active={filters.orderStatus === opt.value}
                    onClick={() => { setFilters({ ...filters, orderStatus: opt.value }); setOpenDropdown(null); }}
                  >
                    <OrderStatusDot color={opt.color} />
                    <span style={{ marginLeft: 8 }}>{opt.label}</span>
                  </FilterOption>
                ))}
              </FilterMenu>
            </FilterDropdown>
          )}
          
          {/* Fiscal Check filter */}
          {activeExtraFilters.includes('fiscalCheck') && (
            <FilterDropdown>
              <FilterButton onClick={() => setOpenDropdown(openDropdown === 'fiscalCheck' ? null : 'fiscalCheck')}>
                фискальный чек
                <span>{fiscalOptions.find(o => o.value === filters.fiscalCheck)?.label || 'введите'}</span>
                <ClearFilterButton onClick={(e) => { e.stopPropagation(); removeExtraFilter('fiscalCheck'); }}>
                  <X size={14} />
                </ClearFilterButton>
              </FilterButton>
              <FilterMenu isOpen={openDropdown === 'fiscalCheck'}>
                {fiscalOptions.map(opt => (
                  <FilterOption
                    key={opt.value}
                    active={filters.fiscalCheck === opt.value}
                    onClick={() => { setFilters({ ...filters, fiscalCheck: opt.value }); setOpenDropdown(null); }}
                  >
                    {opt.label}
                  </FilterOption>
                ))}
              </FilterMenu>
            </FilterDropdown>
          )}

          {/* Extra filters dropdown */}
          <FilterBadge>
            <FilterBadgeButton onClick={() => setOpenDropdown(openDropdown === 'extraFilters' ? null : 'extraFilters')}>
              <Filter size={16} />
              Фильтр
            </FilterBadgeButton>
            <FilterBadgeMenu isOpen={openDropdown === 'extraFilters'}>
              {extraFilterOptions.filter(opt => !activeExtraFilters.includes(opt.value)).map(opt => (
                <FilterOption
                  key={opt.value}
                  onClick={() => addExtraFilter(opt.value)}
                >
                  {opt.label}
                </FilterOption>
              ))}
            </FilterBadgeMenu>
          </FilterBadge>
        </FiltersBar>

        <TableContainer>
          <Table>
            <Thead>
              <tr>
                <Th style={{ width: 50 }}>СТАТУС</Th>
                <Th>ДОКУМЕНТ</Th>
                <Th>ВРЕМЯ</Th>
                <Th>ПОЗИЦИЙ</Th>
                <Th>СУММА</Th>
                <Th>ОПЛАЧЕННЫЕ</Th>
                <Th>ОТПРАВИТЕЛЬ</Th>
                <Th>ПОЛУЧАТЕЛЬ</Th>
                <Th>АВТОР</Th>
              </tr>
            </Thead>
            <tbody>
              {Object.entries(groupedDocs).map(([date, docs]) => (
                <>
                  <DateHeader key={`date-${date}`}>
                    <td colSpan={9}>{date}</td>
                  </DateHeader>
                  {docs.map(doc => (
                    <Tr key={doc._id}>
                      <Td>
                        <StatusCheck checked={doc.status === 'completed' || !doc.status}>
                          <Check size={18} />
                        </StatusCheck>
                      </Td>
                      <Td>
                        <DocLink onClick={() => openDocPanel(doc)}>
                          {getDocTypeName(doc.type)} #{doc.number}
                        </DocLink>
                      </Td>
                      <Td>{formatTime(doc.date || 0)}</Td>
                      <Td>{doc.items?.length || 0}</Td>
                      <Td>{formatPrice(doc.total || 0)}</Td>
                      <Td>
                        <PaidCell>
                          {doc.discount_percent ? (
                            <>
                              <DiscountBadge>✕</DiscountBadge>
                              {formatPrice(doc.total || 0)}
                            </>
                          ) : (
                            formatPrice(doc.total || 0)
                          )}
                        </PaidCell>
                      </Td>
                      <Td>
                        <StoreLink onClick={() => openStorePanel(doc._store || '')}>
                          {doc.store_name || getStoreName(doc._store || '')}
                        </StoreLink>
                      </Td>
                      <Td>
                        {doc.type === 'movements' ? (
                          <StoreLink onClick={() => openStorePanel(doc._target || '')}>
                            {doc.target_store_name || getStoreName(doc._target || '')}
                          </StoreLink>
                        ) : (
                          <StoreLink onClick={() => openCustomerPanel(doc._customer || '')}>
                            {doc.customer_name || getCustomerName(doc._customer || '')}
                          </StoreLink>
                        )}
                      </Td>
                      <Td>
                        <StoreLink onClick={() => openUserPanel(doc._user || '', doc.author_name || 'Невідомий')}>
                          {doc.author_name || 'Невідомий'}
                        </StoreLink>
                      </Td>
                    </Tr>
                  ))}
                </>
              ))}
            </tbody>
          </Table>
        </TableContainer>

        {/* Overlay */}
        <PanelOverlay isOpen={panelType !== null} onClick={closePanel} />

        {/* Document Panel */}
        <SlidePanel isOpen={panelType === 'doc' && selectedDoc !== null}>
          {selectedDoc && (
            <>
              <PanelHeader>
                <PanelActions>
                  <CloseButton onClick={closePanel}>
                    <X size={18} />
                  </CloseButton>
                  <PanelButton variant="primary">Редактировать</PanelButton>
                  <PanelButton><Printer size={16} /></PanelButton>
                  <PanelButton><Download size={16} /></PanelButton>
                  <PanelButton><RotateCcw size={16} /></PanelButton>
                </PanelActions>
                <PanelButton variant="danger">Удалить</PanelButton>
              </PanelHeader>
              <PanelContent>
                <PanelTitle>{getDocTypeName(selectedDoc.type)} #{selectedDoc.number}</PanelTitle>
                <PanelSubtitle>
                  <Calendar size={14} />
                  Создан {formatDate(selectedDoc.date || 0)}
                  <Badge color="#10b981">Документ проведён</Badge>
                  <Badge color="#6b7280">Статус заказа ▾</Badge>
                </PanelSubtitle>
                <PanelType>Документ</PanelType>

                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Магазин</InfoLabel>
                    <InfoValue>
                      <StoreLink onClick={() => openStorePanel(selectedDoc._store || selectedDoc._store || '')}>
                        {getStoreName(selectedDoc._store || selectedDoc._store || '')}
                      </StoreLink>
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Скидка</InfoLabel>
                    <InfoValue>{selectedDoc.discount ? `${selectedDoc.discount_percent || 20}% (${formatPrice(selectedDoc.discount || 0)} грн)` : '0%'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Клиент</InfoLabel>
                    <InfoValue>
                      <StoreLink onClick={() => openCustomerPanel(selectedDoc._customer || '')}>
                        {getCustomerName(selectedDoc._customer || '')}
                      </StoreLink>
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Сумма</InfoLabel>
                    <InfoValue>{formatPrice(selectedDoc.total || 0)} грн</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Автор</InfoLabel>
                    <InfoValue>
                      <StoreLink onClick={() => openUserPanel(selectedDoc._user || '', selectedDoc.author_name || 'Невідомий')}>
                        {selectedDoc.author_name || 'Невідомий'}
                      </StoreLink>
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Оплаченные</InfoLabel>
                    <InfoValue>{formatPrice(selectedDoc.total || 0)} грн</InfoValue>
                  </InfoItem>
                  <InfoItem />
                  <InfoItem>
                    <InfoLabel>Сумма налога</InfoLabel>
                    <InfoValue>0.00 грн</InfoValue>
                  </InfoItem>
                </InfoGrid>

                <SectionTitle>ОПЛАТА</SectionTitle>
                <PaymentTable>
                  <thead>
                    <tr>
                      <PaymentTh>#</PaymentTh>
                      <PaymentTh>Счёт</PaymentTh>
                      <PaymentTh>Контрагент</PaymentTh>
                      <PaymentTh>Дата</PaymentTh>
                      <PaymentTh style={{ textAlign: 'right' }}>Сумма</PaymentTh>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <PaymentTd>
                        <span style={{ color: theme.colors.primary }}>●</span> {selectedDoc.number}
                      </PaymentTd>
                      <PaymentTd>
                        <StoreLink onClick={() => openStorePanel(selectedDoc._store || selectedDoc._store || '')}>
                          {getStoreName(selectedDoc._store || selectedDoc._store || '')}
                        </StoreLink>
                      </PaymentTd>
                      <PaymentTd>
                        <StoreLink onClick={() => openCustomerPanel(selectedDoc._customer || '')}>
                          {getCustomerName(selectedDoc._customer || '')}
                        </StoreLink>
                      </PaymentTd>
                      <PaymentTd>{formatDate(selectedDoc.date || 0)}</PaymentTd>
                      <PaymentTd style={{ textAlign: 'right' }}>{formatPrice(selectedDoc.total || 0)} грн</PaymentTd>
                    </tr>
                  </tbody>
                </PaymentTable>

                <SectionTitle>ТОВАРЫ</SectionTitle>
                <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <SearchInput style={{ flex: 1 }}>
                    <Search size={16} color="#9ca3af" />
                    <input placeholder="Поиск товаров" />
                  </SearchInput>
                  <FilterButton>
                    Действия над товарами <ChevronDown size={14} />
                  </FilterButton>
                </div>
                <ProductsTable>
                  <thead>
                    <tr>
                      <ProductTh>Наименование</ProductTh>
                      <ProductTh>Штрих-код</ProductTh>
                      <ProductTh>Артикул</ProductTh>
                      <ProductTh>Количество</ProductTh>
                      <ProductTh>Цена</ProductTh>
                      <ProductTh>Скидка</ProductTh>
                      <ProductTh>Итог</ProductTh>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedDoc.items || []).map((item: any, index: number) => (
                      <tr key={index}>
                        <ProductTd>
                          <ProductName>
                            <ProductColor color={getProductColor(index)} />
                            {item.name || item.title || `Товар ${index + 1}`}
                          </ProductName>
                        </ProductTd>
                        <ProductTd>{item.barcode || '-'}</ProductTd>
                        <ProductTd>{item.sku || item.article || '-'}</ProductTd>
                        <ProductTd>{Math.abs(item.qty || item.quantity || 1)}</ProductTd>
                        <ProductTd>{formatPrice(item.price || 0)}</ProductTd>
                        <ProductTd>{item.discount_sum ? formatPrice(item.discount_sum) : '0.00'}</ProductTd>
                        <ProductTd>{formatPrice(item.sum || ((item.price || 0) * Math.abs(item.qty || item.quantity || 1)))}</ProductTd>
                      </tr>
                    ))}
                    <TotalRow>
                      <td colSpan={3}>Итог</td>
                      <td>{(selectedDoc.items || []).reduce((sum: number, item: any) => sum + Math.abs(item.qty || item.quantity || 1), 0)}</td>
                      <td>-</td>
                      <td>{formatPrice(selectedDoc.discount || 0)}</td>
                      <td>{formatPrice(selectedDoc.total || 0)}</td>
                    </TotalRow>
                  </tbody>
                </ProductsTable>
              </PanelContent>
            </>
          )}
        </SlidePanel>

        {/* Store Panel */}
        <SlidePanel isOpen={panelType === 'store' && selectedStore !== null}>
          {selectedStore && (
            <>
              <PanelHeader>
                <PanelActions>
                  <CloseButton onClick={closePanel}>
                    <X size={18} />
                  </CloseButton>
                  <PanelButton variant="primary">Редактировать</PanelButton>
                </PanelActions>
                <PanelButton variant="danger">Удалить</PanelButton>
              </PanelHeader>
              <PanelContent>
                <PanelTitle>{selectedStore.name}</PanelTitle>
                <PanelSubtitle>
                  Создан {formatDate(selectedStore.created || 1489579200)}
                </PanelSubtitle>
                <PanelType>Магазин</PanelType>

                <Badge color="#f59e0b" style={{ marginTop: 12 }}>По умолчанию</Badge>

                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                  <span style={{ width: 12, height: 12, background: theme.colors.primary, borderRadius: '50%' }} />
                  Склад та офіс
                </div>

                <SectionTitle>ПОСЛЕДНИЕ ОПЕРАЦИИ</SectionTitle>
                <TabsContainer>
                  <Tab active>Движение товара</Tab>
                  <Tab>Движение денег</Tab>
                </TabsContainer>

                {Object.entries(
                  getStoreRecentDocs(selectedStore._id).reduce((acc: Record<string, Document[]>, doc) => {
                    const date = format(new Date((doc.date || 0) * 1000), 'd MMMM', { locale: ru });
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(doc);
                    return acc;
                  }, {})
                ).map(([date, docs]) => (
                  <div key={date}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, margin: '16px 0 12px' }}>{date}</h4>
                    {docs.map(doc => (
                      <OperationCard key={doc._id}>
                        <OperationHeader>
                          <OperationTitle onClick={() => openDocPanel(doc)}>
                            {getDocTypeName(doc.type)} #{doc.number}
                          </OperationTitle>
                          <OperationAmount>
                            <div style={{ fontWeight: 600 }}>{formatPrice(doc.total || 0)} грн</div>
                            {doc.discount_percent && <div style={{ fontSize: 13, color: '#6b7280' }}>{doc.discount_percent}%</div>}
                          </OperationAmount>
                        </OperationHeader>
                        <OperationMeta>
                          <span style={{ color: theme.colors.primary }}>●</span>
                          Магазин <StoreLink onClick={() => {}}>{selectedStore.name}</StoreLink> &gt;
                          {doc.type === 'movements' ? (
                            <>Магазин <StoreLink onClick={() => openStorePanel(doc._target || '')}>{getStoreName(doc._target || '')}</StoreLink></>
                          ) : (
                            <>клиент <StoreLink onClick={() => openCustomerPanel(doc._customer || '')}>{getCustomerName(doc._customer || '')}</StoreLink></>
                          )}
                        </OperationMeta>
                        <OperationMeta>
                          <StoreLink onClick={() => openUserPanel(doc._user || '', 'Олег Кицюк')}>
                            Олег Кицюк
                          </StoreLink>
                          {formatDate(doc.date || 0)} {formatTime(doc.date || 0)}
                        </OperationMeta>
                        <OperationStatus>
                          <Check size={14} />
                          Документ оплачен
                        </OperationStatus>
                        <OperationExpand>
                          {doc.items?.length || 0} позиций
                          <ChevronDown size={14} />
                        </OperationExpand>
                      </OperationCard>
                    ))}
                  </div>
                ))}
              </PanelContent>
            </>
          )}
        </SlidePanel>

        {/* Customer Panel */}
        <SlidePanel isOpen={panelType === 'customer' && selectedCustomer !== null}>
          {selectedCustomer && (
            <>
              <PanelHeader>
                <PanelActions>
                  <CloseButton onClick={closePanel}>
                    <X size={18} />
                  </CloseButton>
                  <PanelButton variant="primary">Редактировать</PanelButton>
                </PanelActions>
                <PanelButton variant="danger">Удалить</PanelButton>
              </PanelHeader>
              <PanelContent>
                <PanelTitle>{selectedCustomer.name}</PanelTitle>
                <PanelSubtitle>
                  Создан {formatDate(selectedCustomer.created || 1603670400)}
                </PanelSubtitle>
                <PanelType>Клиент</PanelType>

                <SectionTitle>КОНТАКТЫ</SectionTitle>
                <ContactInfo>
                  {selectedCustomer.phones?.[0] && (
                    <ContactItem>
                      <Phone size={14} />
                      {selectedCustomer.phones[0]}
                    </ContactItem>
                  )}
                  {selectedCustomer.emails?.[0] && (
                    <ContactItem>
                      <Mail size={14} />
                      {selectedCustomer.emails[0]}
                    </ContactItem>
                  )}
                </ContactInfo>

                <SectionTitle>ПОСЛЕДНИЕ ОПЕРАЦИИ</SectionTitle>
                <TabsContainer>
                  <Tab active>Движение товара</Tab>
                  <Tab>Движение денег</Tab>
                  <Tab>История бонусов</Tab>
                </TabsContainer>

                {Object.entries(
                  getCustomerRecentDocs(selectedCustomer._id).reduce((acc: Record<string, Document[]>, doc) => {
                    const date = format(new Date((doc.date || 0) * 1000), 'd MMMM', { locale: ru });
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(doc);
                    return acc;
                  }, {})
                ).map(([date, docs]) => (
                  <div key={date}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, margin: '16px 0 12px' }}>{date}</h4>
                    {docs.map(doc => (
                      <OperationCard key={doc._id}>
                        <OperationHeader>
                          <OperationTitle onClick={() => openDocPanel(doc)}>
                            {getDocTypeName(doc.type)} #{doc.number}
                          </OperationTitle>
                          <OperationAmount>
                            <div style={{ fontWeight: 600 }}>{formatPrice(doc.total || 0)} грн</div>
                            {doc.discount_percent && <div style={{ fontSize: 13, color: '#6b7280' }}>{doc.discount_percent}%</div>}
                          </OperationAmount>
                        </OperationHeader>
                        <OperationMeta>
                          <span style={{ color: theme.colors.primary }}>●</span>
                          Магазин <StoreLink onClick={() => openStorePanel(doc._store || '')}>{getStoreName(doc._store || '')}</StoreLink> &gt;
                          клиент <StoreLink onClick={() => {}}>{selectedCustomer.name}</StoreLink>
                        </OperationMeta>
                        <OperationMeta>
                          <StoreLink onClick={() => openUserPanel(doc._user || '', 'Олег Кицюк')}>
                            Олег Кицюк
                          </StoreLink>
                          {formatDate(doc.date || 0)} {formatTime(doc.date || 0)}
                        </OperationMeta>
                        <OperationStatus>
                          <Check size={14} />
                          Документ оплачен
                        </OperationStatus>
                        <OperationExpand>
                          {doc.items?.length || 0} позиций
                          <ChevronDown size={14} />
                        </OperationExpand>
                      </OperationCard>
                    ))}
                  </div>
                ))}
              </PanelContent>
            </>
          )}
        </SlidePanel>

        {/* User Panel */}
        <SlidePanel isOpen={panelType === 'user' && selectedUser !== null}>
          {selectedUser && (
            <>
              <PanelHeader>
                <PanelActions>
                  <CloseButton onClick={closePanel}>
                    <X size={18} />
                  </CloseButton>
                  <PanelButton variant="primary">Редактировать</PanelButton>
                </PanelActions>
              </PanelHeader>
              <PanelContent>
                <PanelTitle>{selectedUser.name}</PanelTitle>
                <PanelSubtitle>
                  Создан {formatDate(selectedUser.created || 1489579200)}
                </PanelSubtitle>
                <PanelType>{selectedUser.role || 'Владелец'}</PanelType>

                <ContactInfo style={{ marginTop: 16 }}>
                  {selectedUser.phone && (
                    <ContactItem>
                      <Phone size={14} />
                      {selectedUser.phone}
                    </ContactItem>
                  )}
                  {selectedUser.email && (
                    <ContactItem>
                      <Mail size={14} />
                      {selectedUser.email}
                    </ContactItem>
                  )}
                </ContactInfo>

                <SectionTitle>ПОСЛЕДНИЕ ОПЕРАЦИИ</SectionTitle>

                {Object.entries(
                  documents.slice(0, 10).reduce((acc: Record<string, Document[]>, doc) => {
                    const date = format(new Date((doc.date || 0) * 1000), 'd MMMM', { locale: ru });
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(doc);
                    return acc;
                  }, {})
                ).map(([date, docs]) => (
                  <div key={date}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, margin: '16px 0 12px' }}>{date}</h4>
                    {docs.map(doc => (
                      <OperationCard key={doc._id}>
                        <OperationHeader>
                          <OperationTitle onClick={() => openDocPanel(doc)}>
                            {getDocTypeName(doc.type)} #{doc.number}
                          </OperationTitle>
                          <OperationAmount>
                            <div style={{ fontWeight: 600 }}>{formatPrice(doc.total || 0)} грн</div>
                            {doc.discount_percent && <div style={{ fontSize: 13, color: '#6b7280' }}>{doc.discount_percent}%</div>}
                          </OperationAmount>
                        </OperationHeader>
                        <OperationMeta>
                          <span style={{ color: theme.colors.primary }}>●</span>
                          Магазин <StoreLink onClick={() => openStorePanel(doc._store || '')}>{getStoreName(doc._store || '')}</StoreLink> &gt;
                          {doc.type === 'movements' ? (
                            <>Магазин <StoreLink onClick={() => openStorePanel(doc._target || '')}>{getStoreName(doc._target || '')}</StoreLink></>
                          ) : (
                            <>клиент <StoreLink onClick={() => openCustomerPanel(doc._customer || '')}>{getCustomerName(doc._customer || '')}</StoreLink></>
                          )}
                        </OperationMeta>
                        <OperationMeta>
                          <StoreLink onClick={() => {}}>
                            {selectedUser.name}
                          </StoreLink>
                          {formatDate(doc.date || 0)} {formatTime(doc.date || 0)}
                        </OperationMeta>
                        <OperationStatus>
                          <Check size={14} />
                          Документ оплачен
                        </OperationStatus>
                        <OperationExpand>
                          {doc.items?.length || 0} позиций
                          <ChevronDown size={14} />
                        </OperationExpand>
                      </OperationCard>
                    ))}
                  </div>
                ))}
              </PanelContent>
            </>
          )}
        </SlidePanel>
      </PageContainer>
    </MainLayout>
  );
}
