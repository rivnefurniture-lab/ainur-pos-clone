import styled from 'styled-components';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import MainLayout from '../components/Layout/MainLayout';
import { useAppSelector } from '../hooks/useRedux';
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

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const DateRange = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  font-size: 14px;

  svg {
    color: ${theme.colors.textMuted};
  }
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: ${theme.colors.gray100};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid ${theme.colors.border};
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const StatIcon = styled.div<{ color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${props => props.color}15;
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatTrend = styled.div<{ positive?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.positive ? theme.colors.success : theme.colors.danger};
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${theme.colors.textPrimary};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${theme.colors.textSecondary};
`;

const ReportsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid ${theme.colors.border};
  padding: 20px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px;
`;

const ChartPlaceholder = styled.div`
  height: 300px;
  background: ${theme.colors.gray50};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textMuted};
  font-size: 14px;
`;

const TopItemsList = styled.div``;

const TopItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid ${theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const ItemRank = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${theme.colors.gray100};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textSecondary};
  margin-right: 12px;
`;

const ItemName = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
`;

const ItemValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const QuickReports = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 24px;
`;

const ReportLink = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 1px solid ${theme.colors.border};
  border-radius: 12px;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primaryLight};
  }
`;

const ReportIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${theme.colors.primaryLight};
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ReportInfo = styled.div``;

const ReportName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${theme.colors.textPrimary};
`;

const ReportDescription = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin-top: 2px;
`;

export default function Reports() {
  const { products, customers, documents } = useAppSelector(state => state.data);

  const formatPrice = (price: number) => price.toFixed(2) + ' ₴';

  // Calculate basic stats
  const totalSales = documents
    .filter(d => d.type === 'sale')
    .reduce((sum, d) => sum + d.total, 0);

  const totalProfit = documents
    .filter(d => d.type === 'sale')
    .reduce((sum, d) => sum + (d.profit || 0), 0);

  const salesCount = documents.filter(d => d.type === 'sale').length;

  // Top products (placeholder data)
  const topProducts = products.slice(0, 5).map((p, i) => ({
    rank: i + 1,
    name: p.name,
    value: Math.floor(Math.random() * 10000),
  }));

  return (
    <MainLayout title="Звіти">
      <PageHeader>
        <PageTitle>Звіти та аналітика</PageTitle>
        <HeaderActions>
          <DateRange>
            <Calendar size={18} />
            Останні 30 днів
          </DateRange>
          <ExportButton>
            <Download size={18} />
            Експорт
          </ExportButton>
        </HeaderActions>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatIcon color={theme.colors.success}>
              <DollarSign size={22} />
            </StatIcon>
            <StatTrend positive>
              <ArrowUpRight size={16} />
              +12.5%
            </StatTrend>
          </StatHeader>
          <StatValue>{formatPrice(totalSales)}</StatValue>
          <StatLabel>Загальний дохід</StatLabel>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon color={theme.colors.info}>
              <TrendingUp size={22} />
            </StatIcon>
            <StatTrend positive>
              <ArrowUpRight size={16} />
              +8.2%
            </StatTrend>
          </StatHeader>
          <StatValue>{formatPrice(totalProfit)}</StatValue>
          <StatLabel>Чистий прибуток</StatLabel>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon color={theme.colors.warning}>
              <Package size={22} />
            </StatIcon>
            <StatTrend>
              <ArrowDownRight size={16} />
              -3.1%
            </StatTrend>
          </StatHeader>
          <StatValue>{salesCount}</StatValue>
          <StatLabel>Кількість продажів</StatLabel>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon color={theme.colors.primary}>
              <Users size={22} />
            </StatIcon>
            <StatTrend positive>
              <ArrowUpRight size={16} />
              +5.7%
            </StatTrend>
          </StatHeader>
          <StatValue>{customers.length}</StatValue>
          <StatLabel>Активних клієнтів</StatLabel>
        </StatCard>
      </StatsGrid>

      <ReportsGrid>
        <ChartCard>
          <CardTitle>Динаміка продажів</CardTitle>
          <ChartPlaceholder>
            <BarChart3 size={48} />
            <span style={{ marginLeft: 12 }}>Графік продажів за період</span>
          </ChartPlaceholder>
        </ChartCard>

        <ChartCard>
          <CardTitle>Топ товарів</CardTitle>
          <TopItemsList>
            {topProducts.map(item => (
              <TopItem key={item.rank}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ItemRank>{item.rank}</ItemRank>
                  <ItemName>{item.name.slice(0, 30)}...</ItemName>
                </div>
                <ItemValue>{formatPrice(item.value)}</ItemValue>
              </TopItem>
            ))}
          </TopItemsList>
        </ChartCard>
      </ReportsGrid>

      <QuickReports>
        <ReportLink>
          <ReportIcon>
            <DollarSign size={20} />
          </ReportIcon>
          <ReportInfo>
            <ReportName>Фінансовий звіт</ReportName>
            <ReportDescription>Доходи, витрати, прибуток</ReportDescription>
          </ReportInfo>
        </ReportLink>

        <ReportLink>
          <ReportIcon>
            <Package size={20} />
          </ReportIcon>
          <ReportInfo>
            <ReportName>Звіт по товарах</ReportName>
            <ReportDescription>Продажі, залишки, рух</ReportDescription>
          </ReportInfo>
        </ReportLink>

        <ReportLink>
          <ReportIcon>
            <Users size={20} />
          </ReportIcon>
          <ReportInfo>
            <ReportName>Звіт по клієнтах</ReportName>
            <ReportDescription>Покупки, борги, бонуси</ReportDescription>
          </ReportInfo>
        </ReportLink>
      </QuickReports>
    </MainLayout>
  );
}
