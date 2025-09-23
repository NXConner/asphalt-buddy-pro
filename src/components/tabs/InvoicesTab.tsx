import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Download, Eye, Calendar, DollarSign } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  notes?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export const InvoicesTab = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<Partial<Invoice>>({
    status: 'draft',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    items: []
  });

  useEffect(() => {
    // Load invoices from localStorage
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    setInvoices(savedInvoices);

    // Load estimates that haven't been invoiced yet
    const savedEstimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    const uninvoicedJobs = savedEstimates.filter((estimate: any) => {
      return !savedInvoices.some((invoice: Invoice) => invoice.id === estimate.id);
    });
    setAvailableJobs(uninvoicedJobs);
  }, []);

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = invoices.length + 1;
    return `INV-${year}${month}-${String(count).padStart(3, '0')}`;
  };

  const createFromJob = (job: any) => {
    const items: InvoiceItem[] = [];
    
    if (job.asphaltRepair?.crackLength > 0) {
      items.push({
        description: `Crack Repair - ${job.asphaltRepair.crackLength} linear feet`,
        quantity: job.asphaltRepair.crackLength,
        rate: 2.50,
        amount: job.asphaltRepair.crackLength * 2.50
      });
    }

    if (job.sealcoating?.area > 0) {
      items.push({
        description: `Sealcoating - ${job.sealcoating.area} sq ft (${job.sealcoating.coats} coat${job.sealcoating.coats > 1 ? 's' : ''})`,
        quantity: job.sealcoating.area,
        rate: 0.25 * job.sealcoating.coats,
        amount: job.sealcoating.area * 0.25 * job.sealcoating.coats
      });
    }

    if (job.premiumServices?.length > 0) {
      items.push({
        description: `Premium Services (${job.premiumServices.length} services)`,
        quantity: 1,
        rate: parseFloat(job.calculation?.premium || '0'),
        amount: parseFloat(job.calculation?.premium || '0')
      });
    }

    setNewInvoice({
      ...newInvoice,
      invoiceNumber: generateInvoiceNumber(),
      customerId: job.id,
      customerName: job.customer.name,
      total: parseFloat(job.calculation?.total || '0'),
      items
    });
  };

  const saveInvoice = () => {
    if (!newInvoice.customerName || !newInvoice.items?.length) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: newInvoice.invoiceNumber || generateInvoiceNumber(),
      customerId: newInvoice.customerId || '',
      customerName: newInvoice.customerName || '',
      date: newInvoice.date || new Date().toISOString().split('T')[0],
      dueDate: newInvoice.dueDate || '',
      total: newInvoice.total || 0,
      status: newInvoice.status as any || 'draft',
      items: newInvoice.items || [],
      notes: newInvoice.notes
    };

    const updatedInvoices = [...invoices, invoice];
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    toast({
      title: "Invoice created!",
      description: `Invoice ${invoice.invoiceNumber} has been created successfully.`
    });

    setIsCreateDialogOpen(false);
    setNewInvoice({
      status: 'draft',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: []
    });
  };

  const updateInvoiceStatus = (invoiceId: string, status: Invoice['status']) => {
    const updatedInvoices = invoices.map(inv => 
      inv.id === invoiceId ? { ...inv, status } : inv
    );
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

    toast({
      title: "Invoice updated",
      description: `Invoice status changed to ${status}.`
    });
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'sent': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-professional">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceNumber">Invoice Number</Label>
                      <Input
                        id="invoiceNumber"
                        value={newInvoice.invoiceNumber || generateInvoiceNumber()}
                        onChange={(e) => setNewInvoice({...newInvoice, invoiceNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        value={newInvoice.customerName || ''}
                        onChange={(e) => setNewInvoice({...newInvoice, customerName: e.target.value})}
                      />
                    </div>
                  </div>

                  {availableJobs.length > 0 && (
                    <div>
                      <Label>Create from existing job</Label>
                      <Select onValueChange={(value) => {
                        const job = availableJobs.find(j => j.id === value);
                        if (job) createFromJob(job);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job to invoice" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableJobs.map((job) => (
                            <SelectItem key={job.id} value={job.id}>
                              {job.customer.name} - {job.customer.date} - ${job.calculation?.total || '0'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Invoice Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newInvoice.date}
                        onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newInvoice.dueDate}
                        onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newInvoice.notes || ''}
                      onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={saveInvoice} className="btn-primary">
                      Create Invoice
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No invoices created yet. Create your first invoice!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{invoice.invoiceNumber}</h4>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Customer: {invoice.customerName}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {invoice.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${invoice.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={invoice.status}
                          onValueChange={(value: Invoice['status']) => updateInvoiceStatus(invoice.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};