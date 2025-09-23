import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Plus, AlertTriangle } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface JobCost {
  id: string;
  jobId: string;
  jobName: string;
  estimatedCost: number;
  actualCost: number;
  materialCost: number;
  laborCost: number;
  overhead: number;
  profit: number;
  status: 'active' | 'completed';
  startDate: string;
  endDate?: string;
}

export const JobCostingTab = () => {
  const { toast } = useToast();
  const [jobCosts, setJobCosts] = useState<JobCost[]>([]);
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [newCost, setNewCost] = useState<Partial<JobCost>>({
    status: 'active',
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Load job costs from localStorage (would be Supabase in production)
    const savedCosts = JSON.parse(localStorage.getItem('jobCosts') || '[]');
    setJobCosts(savedCosts);
  }, []);

  const addJobCost = () => {
    if (!newCost.jobName || !newCost.estimatedCost) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const jobCost: JobCost = {
      id: Date.now().toString(),
      jobId: newCost.jobId || Date.now().toString(),
      jobName: newCost.jobName || '',
      estimatedCost: newCost.estimatedCost || 0,
      actualCost: newCost.actualCost || 0,
      materialCost: newCost.materialCost || 0,
      laborCost: newCost.laborCost || 0,
      overhead: newCost.overhead || 0,
      profit: (newCost.actualCost || 0) - (newCost.materialCost || 0) - (newCost.laborCost || 0) - (newCost.overhead || 0),
      status: newCost.status as any || 'active',
      startDate: newCost.startDate || new Date().toISOString().split('T')[0],
      endDate: newCost.endDate
    };

    const updatedCosts = [...jobCosts, jobCost];
    setJobCosts(updatedCosts);
    localStorage.setItem('jobCosts', JSON.stringify(updatedCosts));

    toast({
      title: "Job cost added!",
      description: `Job costing for ${jobCost.jobName} has been created.`
    });

    setIsAddingCost(false);
    setNewCost({
      status: 'active',
      startDate: new Date().toISOString().split('T')[0]
    });
  };

  const getProfitMargin = (job: JobCost) => {
    if (job.actualCost === 0) return 0;
    return ((job.profit / job.actualCost) * 100);
  };

  const getVariance = (estimated: number, actual: number) => {
    if (estimated === 0) return 0;
    return ((actual - estimated) / estimated) * 100;
  };

  const chartData = jobCosts.map(job => ({
    name: job.jobName.substring(0, 10) + "...",
    estimated: job.estimatedCost,
    actual: job.actualCost,
    profit: job.profit
  }));

  const pieData = [
    { name: 'Materials', value: jobCosts.reduce((sum, job) => sum + job.materialCost, 0), color: '#8884d8' },
    { name: 'Labor', value: jobCosts.reduce((sum, job) => sum + job.laborCost, 0), color: '#82ca9d' },
    { name: 'Overhead', value: jobCosts.reduce((sum, job) => sum + job.overhead, 0), color: '#ffc658' },
    { name: 'Profit', value: jobCosts.reduce((sum, job) => sum + job.profit, 0), color: '#ff7300' }
  ];

  const totalProfit = jobCosts.reduce((sum, job) => sum + job.profit, 0);
  const totalRevenue = jobCosts.reduce((sum, job) => sum + job.actualCost, 0);
  const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold text-green-600">${totalProfit.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Margin</p>
                <p className="text-2xl font-bold">{averageMargin.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{jobCosts.filter(j => j.status === 'active').length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <Card className="card-professional">
          <CardHeader>
            <CardTitle>Cost vs Estimate Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="estimated" fill="#8884d8" name="Estimated" />
                <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-professional">
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Job List */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Job Costing
            </CardTitle>
            <Dialog open={isAddingCost} onOpenChange={setIsAddingCost}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Job Cost
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Job Cost Tracking</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="jobName">Job Name</Label>
                    <Input
                      id="jobName"
                      value={newCost.jobName || ''}
                      onChange={(e) => setNewCost({...newCost, jobName: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estimatedCost">Estimated Cost</Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        step="0.01"
                        value={newCost.estimatedCost || ''}
                        onChange={(e) => setNewCost({...newCost, estimatedCost: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="actualCost">Actual Cost</Label>
                      <Input
                        id="actualCost"
                        type="number"
                        step="0.01"
                        value={newCost.actualCost || ''}
                        onChange={(e) => setNewCost({...newCost, actualCost: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="materialCost">Material Cost</Label>
                      <Input
                        id="materialCost"
                        type="number"
                        step="0.01"
                        value={newCost.materialCost || ''}
                        onChange={(e) => setNewCost({...newCost, materialCost: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="laborCost">Labor Cost</Label>
                      <Input
                        id="laborCost"
                        type="number"
                        step="0.01"
                        value={newCost.laborCost || ''}
                        onChange={(e) => setNewCost({...newCost, laborCost: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="overhead">Overhead</Label>
                      <Input
                        id="overhead"
                        type="number"
                        step="0.01"
                        value={newCost.overhead || ''}
                        onChange={(e) => setNewCost({...newCost, overhead: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingCost(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addJobCost} className="btn-primary">
                      Add Job Cost
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {jobCosts.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No job costs tracked yet. Start tracking your job profitability!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobCosts.map((job) => {
                const variance = getVariance(job.estimatedCost, job.actualCost);
                const margin = getProfitMargin(job);
                
                return (
                  <Card key={job.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{job.jobName}</h4>
                            <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                              {job.status}
                            </Badge>
                            {Math.abs(variance) > 10 && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {variance > 0 ? 'Over' : 'Under'} Budget
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Estimated</p>
                              <p className="font-medium">${job.estimatedCost.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Actual</p>
                              <p className="font-medium">${job.actualCost.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Profit</p>
                              <p className={`font-medium ${job.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${job.profit.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Margin</p>
                              <p className={`font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {margin.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            {variance > 0 ? (
                              <TrendingUp className="h-4 w-4 text-red-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-sm font-medium ${variance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {Math.abs(variance).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {variance > 0 ? 'Over budget' : 'Under budget'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};