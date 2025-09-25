import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, Bar, Line, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { getDashboard, getTransactions, getInvestments, getSettings } from "@/lib/api";
import { format, subMonths, startOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isWithinInterval } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

type Transaction = {
  id: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  occurredAt: string;
};

type InvestmentData = {
  equity: number;
  debt: number;
  gold: number;
  others: number;
};

type Settings = {
  weeklyTopUp: number;
  autoSaveRate: number;
  minThreshold: number;
  roundUpsEnabled: boolean;
};

type MonthlySavingsEntry = {
  month: string;
  amount: number;
  projectedAmount?: number;
};

type InvestmentDistributionEntry = {
  name: string;
  value: number;
  percentage: number;
  fill: string;
};

type DashboardData = {
  totalSaved: number;
  totalInvested: number;
  monthlySavings: MonthlySavingsEntry[];
  investmentDistribution: InvestmentDistributionEntry[];
  recentTransactions: Transaction[];
  savingsTrend: Array<{ date: string; amount: number }>;
  weeklyTopUp: number;
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<DashboardData>({
    totalSaved: 0,
    totalInvested: 0,
    monthlySavings: [],
    investmentDistribution: [],
    recentTransactions: [],
    savingsTrend: [],
    weeklyTopUp: 0,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel with proper error handling
        const [dashboardResponse, transactionsResponse, investmentsResponse, settingsResponse] = await Promise.all([
          getDashboard().catch(error => {
            console.error('Error fetching dashboard:', error);
            return { treasuryBalance: 0, investedAmount: 0 };
          }),
          getTransactions().catch(error => {
            console.error('Error fetching transactions:', error);
            return [];
          }),
          getInvestments().catch(error => {
            console.error('Error fetching investments:', error);
            return { equity: 0, debt: 0, gold: 0, others: 0 };
          }),
          getSettings().catch(error => {
            console.error('Error fetching settings:', error);
            return { weeklyTopUp: 0, autoSaveRate: 3.5, minThreshold: 100, roundUpsEnabled: true };
          })
        ]);

        // Safely extract and process data from responses
        const dashboardData = dashboardResponse || { treasuryBalance: 0, investedAmount: 0 };
        const transactions = Array.isArray(transactionsResponse) ? transactionsResponse : [];
        const settings = settingsResponse || { weeklyTopUp: 0, autoSaveRate: 3.5, minThreshold: 100, roundUpsEnabled: true };
        
        // Process investments with safe access and validation
        const safeInvestments = {
          equity: typeof investmentsResponse?.equity === 'number' ? investmentsResponse.equity : 0,
          debt: typeof investmentsResponse?.debt === 'number' ? investmentsResponse.debt : 0,
          gold: typeof investmentsResponse?.gold === 'number' ? investmentsResponse.gold : 0,
          others: typeof investmentsResponse?.others === 'number' ? investmentsResponse.others : 0,
        };

        // Process transactions for the selected time range
        const now = new Date();
        let startDate: Date = startOfMonth(now); // Default to month view
        
        try {
          switch (timeRange) {
            case 'week':
              startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
            case 'month':
            default:
              startDate = startOfMonth(now);
          }
        } catch (error) {
          console.error('Error setting date range:', error);
          startDate = startOfMonth(now); // Fallback to month view
        }

        // Ensure transactions is an array and has the expected structure
        const safeTransactions = (Array.isArray(transactions) ? transactions : [])
          .filter(tx => {
            try {
              return tx && 
                     typeof tx === 'object' && 
                     'occurredAt' in tx && 
                     'amount' in tx &&
                     'type' in tx;
            } catch (e) {
              return false;
            }
          })
          .map(tx => ({
            ...tx,
            amount: typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0,
            type: tx.type === 'credit' ? 'credit' as const : 'debit' as const,
            occurredAt: tx.occurredAt || new Date().toISOString(),
            description: tx.description || 'Transaction',
            id: tx.id || Math.random().toString(36).substr(2, 9)
          }));

        // Filter transactions by date range
        const filteredTransactions = safeTransactions.filter(tx => {
          try {
            const txDate = new Date(tx.occurredAt);
            return !isNaN(txDate.getTime()) && txDate >= startDate;
          } catch (e) {
            console.warn('Invalid transaction date:', tx.occurredAt);
            return false;
          }
        });

        // Calculate total saved from all credit transactions
        const totalSaved = safeTransactions
          .filter(tx => tx.type === 'credit')
          .reduce((sum, tx) => {
            const amount = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0;
            return sum + amount;
          }, 0);
          
        // Calculate total invested from investments data
        const totalInvested = Object.values(safeInvestments)
          .reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);

        // Process monthly savings data with improved accuracy
        const monthlyData: MonthlySavingsEntry[] = Array.from({ length: 12 }, (_, i) => {
          try {
            const monthDate = new Date(now.getFullYear(), i, 1);
            const monthEndDate = new Date(now.getFullYear(), i + 1, 0);
            
            // Get all credit transactions for this month
            const monthCredits = safeTransactions
              .filter(tx => {
                try {
                  if (tx.type !== 'credit') return false;
                  const txDate = new Date(tx.occurredAt);
                  return txDate.getMonth() === i && 
                         txDate.getFullYear() === now.getFullYear();
                } catch (e) {
                  return false;
                }
              });

            // Calculate total saved this month
            const monthlyTotal = monthCredits.reduce((sum, tx) => {
              return sum + (typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0);
            }, 0);
            
            // If we're in the current month, show a projection if we're not at month end
            let projectedAmount = monthlyTotal;
            if (i === now.getMonth() && now.getDate() < monthEndDate.getDate()) {
              const daysInMonth = monthEndDate.getDate();
              const daysElapsed = now.getDate();
              projectedAmount = Math.round((monthlyTotal / daysElapsed) * daysInMonth);
            }
            
            return {
              month: format(monthDate, 'MMM'),
              amount: monthlyTotal,
              projectedAmount: i === now.getMonth() ? projectedAmount : undefined
            };
          } catch (error) {
            console.error(`Error processing month ${i}:`, error);
            return { 
              month: format(new Date(now.getFullYear(), i, 1), 'MMM'), 
              amount: 0 
            };
          }
        });

        // Process investment distribution with safe access and validation
        const investmentDistribution = [
          { name: 'Equity', value: Math.max(0, safeInvestments.equity || 0) },
          { name: 'Debt', value: Math.max(0, safeInvestments.debt || 0) },
          { name: 'Gold', value: Math.max(0, safeInvestments.gold || 0) },
          { name: 'Others', value: Math.max(0, safeInvestments.others || 0) },
        ].filter(item => item.value > 0);
        
        // Calculate total investment for percentage calculations
        const totalInvestment = investmentDistribution.reduce((sum, item) => sum + item.value, 0);
        
        // Add percentage to each investment type
        const investmentDistributionWithPercentage: InvestmentDistributionEntry[] = investmentDistribution.map(item => ({
          ...item,
          percentage: totalInvestment > 0 ? Number(((item.value / totalInvestment) * 100).toFixed(1)) : 0,
          fill: {
            Equity: '#8884d8',
            Debt: '#82ca9d',
            Gold: '#ffc658',
            Others: '#ff8042',
          }[item.name as 'Equity' | 'Debt' | 'Gold' | 'Others'] || '#8884d8',
        }));

        // Generate savings trend for the selected period
        let savingsTrend = [];
        try {
          const daysInPeriod = eachDayOfInterval({
            start: startDate,
            end: now
          });

          let runningTotal = 0;
          savingsTrend = daysInPeriod.map(date => {
            // Find all transactions up to this date
            const dailyTransactions = safeTransactions.filter(tx => {
              try {
                const txDate = new Date(tx.occurredAt);
                return isSameDay(txDate, date) || txDate < date;
              } catch (e) {
                return false;
              }
            });
            
            // Calculate daily total
            const dailyTotal = dailyTransactions.reduce((sum, tx) => {
              const amount = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0;
              return tx.type === 'credit' ? sum + amount : sum - amount;
            }, 0);
            
            runningTotal += dailyTotal;
            
            return {
              date: format(date, 'MMM d'),
              amount: Math.max(0, runningTotal) // Ensure amount is never negative
            };
          });
        } catch (error) {
          console.error('Error generating savings trend:', error);
          // Fallback to a simple trend if there's an error
          savingsTrend = [{ date: format(now, 'MMM d'), amount: totalSaved }];
        }

        // Get the last 5 transactions for the recent transactions table
        const recentTransactions = [...safeTransactions]
          .sort((a, b) => {
            try {
              const dateA = new Date(a.occurredAt);
              const dateB = new Date(b.occurredAt);
              return dateB.getTime() - dateA.getTime();
            } catch (e) {
              return 0;
            }
          })
          .slice(0, 5)
          .map(tx => {
            const amount = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0;
            return {
              id: tx.id || Math.random().toString(36).substr(2, 9),
              amount: Math.abs(amount), // Ensure positive amount for display
              type: tx.type === 'credit' ? 'credit' as const : 'debit' as const,
              description: tx.description || 'Transaction',
              occurredAt: tx.occurredAt || new Date().toISOString()
            };
          });

        setData({
          totalSaved,
          totalInvested,
          monthlySavings: monthlyData,
          investmentDistribution: investmentDistributionWithPercentage,
          recentTransactions,
          savingsTrend,
          weeklyTopUp: settings?.weeklyTopUp || 0,
        });

      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling every 30 seconds for real-time updates
    const intervalId = setInterval(fetchData, 30000);
    
    return () => clearInterval(intervalId);
  }, [timeRange, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-[180px]" />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-3/4 mt-1" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-[150px]" />
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-[180px]" />
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Time Range:</span>
          <select
            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.totalSaved.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.totalInvested.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">in progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Savings Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.monthlySavings.map(monthlySavings => ({
                    month: monthlySavings.month,
                    amount: monthlySavings.amount,
                    projectedAmount: monthlySavings.projectedAmount,
                  }))}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                  />
                  <YAxis 
                    tickFormatter={(value) => `₹${value}`}
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Actual Savings"
                    stroke="#8884d8"
                    fillOpacity={0.8}
                    fill="url(#colorValue)"
                    activeDot={{ r: 8 }}
                  />
                  {data.monthlySavings.some(m => 'projectedAmount' in m) && (
                    <Area
                      type="monotone"
                      dataKey="projectedAmount"
                      name="Projected Savings"
                      stroke="#82ca9d"
                      strokeDasharray="5 5"
                      fill="none"
                      activeDot={{ r: 6 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Investment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.investmentDistribution.length > 0 ? (
              <>
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.investmentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        labelLine={false}
                      >
                        {data.investmentDistribution.map((entry, index) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {data.investmentDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{
                          backgroundColor: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'][index % 4]
                        }}
                      />
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm font-medium">
                          ₹{item.value.toLocaleString()} ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No investment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.description}</TableCell>
                  <TableCell>{format(new Date(transaction.occurredAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell 
                    className={`text-right ${
                      transaction.type === 'credit' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
