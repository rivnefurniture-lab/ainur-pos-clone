import { useState, useEffect } from 'react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchProducts, fetchCategories } from '../store/slices/dataSlice';
import { dataApi } from '../services/api';

export default function ProductsTest() {
  const { companyId } = useAppSelector(state => state.auth);
  const { products } = useAppSelector(state => state.data);
  const dispatch = useAppDispatch();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (companyId) {
        console.log('Loading data for company:', companyId);
        try {
          await dispatch(fetchProducts({ companyId }));
          await dispatch(fetchCategories(companyId));
          
          const storesResponse = await dataApi.getStores(companyId);
          console.log('Stores response:', storesResponse);
          if (storesResponse.status && storesResponse.data) {
            setStores(storesResponse.data);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [dispatch, companyId]);

  if (loading) {
    return (
      <MainLayout title="Products Test">
        <div>Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Products Test">
      <div>
        <h1>Products Test Page</h1>
        <p>Company ID: {companyId}</p>
        <p>Products count: {products.length}</p>
        <p>Stores count: {stores.length}</p>
        
        <h2>Stores:</h2>
        <ul>
          {stores.map(store => (
            <li key={store._id}>{store.name}</li>
          ))}
        </ul>

        <h2>First 5 Products:</h2>
        <table border={1} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              {stores.map(store => (
                <th key={store._id}>{store.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.slice(0, 5).map(product => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.price}</td>
                {stores.map(store => (
                  <td key={store._id}>{product.stock?.[store._id] || 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}
