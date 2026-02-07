import { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Filter,
  Download,
  ChevronRight,
  Home,
  Settings,
  ChevronDown,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchProducts, fetchCategories } from '../store/slices/dataSlice';
import { dataApi } from '../services/api';
import type { Product, Store } from '../types';
import { theme } from '../styles/GlobalStyles';

const PageContainer = styled.div``;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: ${theme.colors.textSecondary};

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
      text-decoration: underline;
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  background: ${props => props.$primary ? '#4caf50' : 'white'};
  color: ${props => props.$primary ? 'white' : theme.colors.textPrimary};
  border: ${props => props.$primary ? 'none' : `1px solid ${theme.colors.border}`};
  cursor: pointer;

  &:hover {
    background: ${props => props.$primary ? '#45a049' : theme.colors.gray100};
  }
`;

const FiltersBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const SearchInput = styled.div`
  flex: 1;
  max-width: 300px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 6px;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
  }
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid ${props => props.$active ? theme.colors.primary : theme.colors.border};
  background: ${props => props.$active ? theme.colors.primaryLight : 'white'};
  color: ${theme.colors.textPrimary};
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid ${theme.colors.border};
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1400px;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${theme.colors.textSecondary};
  background: ${theme.colors.gray50};
  border-bottom: 1px solid ${theme.colors.border};
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: ${theme.colors.textPrimary};
  border-bottom: 1px solid ${theme.colors.border};
`;

const ProductRow = styled.tr`
  &:hover {
    background: ${theme.colors.gray50};
  }
`;

const ProductImage = styled.div`
  width: 40px;
  height: 40px;
  background: ${theme.colors.gray100};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textMuted};
`;

const ProductName = styled.span`
  font-weight: 500;
  color: ${theme.colors.primary};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid ${theme.colors.border};
`;

export default function Products() {
  console.log('Products component rendering...');
  
  const dispatch = useAppDispatch();
  const { companyId } = useAppSelector(state => state.auth);
  const { products, categories } = useAppSelector(state => state.data);
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  const itemsPerPage = 20;

  useEffect(() => {
    const loadData = async () => {
      if (companyId) {
        console.log('Loading products and stores...');
        dispatch(fetchProducts({ companyId }));
        dispatch(fetchCategories(companyId));
        
        try {
          const storesResponse = await dataApi.getStores(companyId);
          console.log('Stores loaded:', storesResponse);
          if (storesResponse.status && storesResponse.data) {
            setStores(storesResponse.data);
          }
        } catch (error) {
          console.error('Failed to load stores:', error);
        }
      }
    };
    
    loadData();
  }, [dispatch, companyId]);

  useEffect(() => {
    let result = products.filter(p => !p.deleted);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          (p.sku && p.sku.toLowerCase().includes(query)) ||
          (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, searchQuery]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <MainLayout title="Товари та послуги">
      <PageContainer>
        <Breadcrumb>
          <a href="/pos">
            <Home size={16} />
            Головна
          </a>
          <ChevronRight size={16} />
          <span>Товари та послуги / справочник</span>
        </Breadcrumb>

        <PageHeader>
          <PageTitle>Товари та послуги / справочник</PageTitle>
          <HeaderActions>
            <ActionButton>
              <Download size={18} />
              Імпорт товарів
            </ActionButton>
            <ActionButton $primary>
              <Plus size={18} />
              Создать товар
            </ActionButton>
          </HeaderActions>
        </PageHeader>

        <FiltersBar>
          <SearchInput>
            <Search size={18} />
            <input
              type="text"
              placeholder="Поиск по наименованию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </SearchInput>
          
          <FilterButton
            $active={showFilterPanel}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Filter size={18} />
            Фільтр
          </FilterButton>

          <ActionButton>
            <ChevronDown size={16} />
            Дії 10 поз.
          </ActionButton>

          <ActionButton>
            <Settings size={18} />
          </ActionButton>
        </FiltersBar>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th style={{ width: '40px' }}>
                  <input type="checkbox" />
                </Th>
                <Th style={{ width: '60px' }}></Th>
                <Th>Наименование</Th>
                <Th>Код</Th>
                <Th>Артикул</Th>
                <Th>Ед. изм.</Th>
                <Th style={{ textAlign: 'right' }}>Цена продажи</Th>
                <Th style={{ textAlign: 'right' }}>Скидка, %</Th>
                {stores.map(store => (
                  <Th key={store._id} style={{ textAlign: 'right' }}>
                    {store.name}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(product => (
                <ProductRow key={product._id}>
                  <Td>
                    <input type="checkbox" />
                  </Td>
                  <Td>
                    <ProductImage>
                      <ImageIcon size={20} />
                    </ProductImage>
                  </Td>
                  <Td>
                    <ProductName>{product.name}</ProductName>
                  </Td>
                  <Td>{product.code || product._id.slice(-4)}</Td>
                  <Td>{product.sku || '-'}</Td>
                  <Td>шт</Td>
                  <Td style={{ textAlign: 'right' }}>{parseFloat(String(product.price || 0)).toFixed(2)}</Td>
                  <Td style={{ textAlign: 'right' }}>0</Td>
                  {stores.map(store => (
                    <Td key={store._id} style={{ textAlign: 'right' }}>
                      {product.stock?.[store._id] || 0}
                    </Td>
                  ))}
                </ProductRow>
              ))}
            </tbody>
          </Table>
          
          <Pagination>
            <span>Страницы {currentPage}</span>
            <div>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ←
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                →
              </button>
            </div>
          </Pagination>
        </TableContainer>
      </PageContainer>
    </MainLayout>
  );
}
