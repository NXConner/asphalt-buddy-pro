import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  address: string;
  email?: string;
  phone?: string;
}

interface Job {
  id: string;
  customerId: string;
  date: string;
  address: string;
  services: string[];
  total: number;
  status: 'estimated' | 'completed' | 'in-progress';
}

export const CustomersTab = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Load data from localStorage
    const savedEstimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    
    // Extract unique customers from estimates
    const uniqueCustomers: Customer[] = [];
    const customerJobs: Job[] = [];

    savedEstimates.forEach((estimate: any) => {
      const customerId = estimate.customer.name.toLowerCase().replace(/\s+/g, '-');
      
      // Add customer if not exists
      if (!uniqueCustomers.find(c => c.id === customerId)) {
        uniqueCustomers.push({
          id: customerId,
          name: estimate.customer.name,
          address: estimate.customer.address,
        });
      }

      // Add job
      const services = [];
      if (estimate.asphaltRepair?.crackLength > 0) services.push('Crack Repair');
      if (estimate.sealcoating?.area > 0) services.push('Sealcoating');
      if (estimate.premiumServices?.length > 0) services.push('Premium Services');

      customerJobs.push({
        id: estimate.id,
        customerId,
        date: estimate.customer.date,
        address: estimate.customer.address,
        services,
        total: parseFloat(estimate.calculation?.total || '0'),
        status: 'estimated'
      });
    });

    setCustomers(uniqueCustomers);
    setJobs(customerJobs);
  }, []);

  const generateFollowUp = (job: Job) => {
    const customer = customers.find(c => c.id === job.customerId);
    if (!customer) return;

    const servicesText = job.services.join(' and ').toLowerCase();
    
    toast({
      title: "✨ AI Follow-up Generated",
      description: `Follow-up email draft ready for ${customer.name}`,
    });

    // This would integrate with Gemini API in production
    console.log(`Follow-up for ${customer.name} regarding ${servicesText} work`);
  };

  const contactCustomer = (customer: Customer) => {
    toast({
      title: "Contact Customer",
      description: `Opening communication center for ${customer.name}`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="card-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customers & Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No customers found. Create some estimates first!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {customers.map((customer) => {
                const customerJobs = jobs.filter(j => j.customerId === customer.id);
                
                return (
                  <Card key={customer.id} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{customer.name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-4 w-4" />
                            {customer.address}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => contactCustomer(customer)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Jobs</h4>
                        {customerJobs.map((job) => (
                          <div
                            key={job.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{job.date}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {job.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {job.services.join(', ')}
                              </div>
                              <div className="font-semibold text-primary">
                                ${job.total.toFixed(2)}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateFollowUp(job)}
                              className="ml-4"
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Follow-up
                            </Button>
                          </div>
                        ))}
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