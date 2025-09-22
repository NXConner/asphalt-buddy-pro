import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FolderOpen, Upload, Download, Eye, Trash2, Plus, FileText, Image, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'receipt' | 'estimate' | 'invoice' | 'photo' | 'other';
  size: string;
  uploadDate: string;
  jobId?: string;
  customerId?: string;
  fileType: string;
  url?: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Johnson_Parking_Lot_Contract.pdf',
    type: 'contract',
    size: '2.3 MB',
    uploadDate: '2024-03-15',
    jobId: 'job-001',
    customerId: 'customer-001',
    fileType: 'pdf'
  },
  {
    id: '2',
    name: 'Material_Receipt_March_2024.pdf',
    type: 'receipt',
    size: '856 KB',
    uploadDate: '2024-03-14',
    fileType: 'pdf'
  },
  {
    id: '3',
    name: 'Before_Photo_MainSt_Lot.jpg',
    type: 'photo',
    size: '4.2 MB',
    uploadDate: '2024-03-13',
    jobId: 'job-002',
    fileType: 'jpg'
  },
  {
    id: '4',
    name: 'Smith_Estimate_2024-001.pdf',
    type: 'estimate',
    size: '1.1 MB',
    uploadDate: '2024-03-12',
    jobId: 'job-003',
    customerId: 'customer-002',
    fileType: 'pdf'
  }
];

export const DocumentsTab = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<Document>>({
    type: 'other'
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    filterDocuments(term, typeFilter);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    filterDocuments(searchTerm, type);
  };

  const filterDocuments = (search: string, type: string) => {
    let filtered = documents;

    if (search) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type !== 'all') {
      filtered = filtered.filter(doc => doc.type === type);
    }

    setFilteredDocs(filtered);
  };

  const getFileIcon = (fileType: string, docType: string) => {
    if (docType === 'photo' || ['jpg', 'jpeg', 'png', 'gif'].includes(fileType.toLowerCase())) {
      return <Image className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const getTypeColor = (type: Document['type']) => {
    switch (type) {
      case 'contract': return 'bg-blue-500';
      case 'receipt': return 'bg-green-500';
      case 'estimate': return 'bg-purple-500';
      case 'invoice': return 'bg-orange-500';
      case 'photo': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const uploadDocument = () => {
    if (!newDoc.name || !newDoc.type) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const document: Document = {
      id: Date.now().toString(),
      name: newDoc.name || '',
      type: newDoc.type as Document['type'],
      size: '1.2 MB', // Mock size
      uploadDate: new Date().toISOString().split('T')[0],
      jobId: newDoc.jobId,
      customerId: newDoc.customerId,
      fileType: newDoc.name?.split('.').pop()?.toLowerCase() || 'unknown'
    };

    const updatedDocs = [...documents, document];
    setDocuments(updatedDocs);
    setFilteredDocs(updatedDocs);

    toast({
      title: "Document uploaded!",
      description: `${document.name} has been uploaded successfully.`
    });

    setIsUploadOpen(false);
    setNewDoc({ type: 'other' });
  };

  const deleteDocument = (id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocs);
    setFilteredDocs(updatedDocs);

    toast({
      title: "Document deleted",
      description: "The document has been removed."
    });
  };

  const documentTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'contract', label: 'Contracts' },
    { value: 'receipt', label: 'Receipts' },
    { value: 'estimate', label: 'Estimates' },
    { value: 'invoice', label: 'Invoices' },
    { value: 'photo', label: 'Photos' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Search and Upload */}
      <Card className="card-professional">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Document Management
            </CardTitle>
            
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="docName">Document Name</Label>
                    <Input
                      id="docName"
                      placeholder="e.g., Contract_Johnson_Parking.pdf"
                      value={newDoc.name || ''}
                      onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="docType">Document Type</Label>
                    <Select 
                      value={newDoc.type} 
                      onValueChange={(value: Document['type']) => setNewDoc({...newDoc, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="estimate">Estimate</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="jobId">Job ID (Optional)</Label>
                      <Input
                        id="jobId"
                        placeholder="job-001"
                        value={newDoc.jobId || ''}
                        onChange={(e) => setNewDoc({...newDoc, jobId: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerId">Customer ID (Optional)</Label>
                      <Input
                        id="customerId"
                        placeholder="customer-001"
                        value={newDoc.customerId || ''}
                        onChange={(e) => setNewDoc({...newDoc, customerId: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drag and drop files here, or click to browse</p>
                    <Button variant="outline" className="mt-2">
                      Choose Files
                    </Button>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={uploadDocument} className="btn-primary">
                      Upload Document
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <Card key={doc.id} className="card-professional hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getFileIcon(doc.fileType, doc.type)}
                  <Badge className={`${getTypeColor(doc.type)} text-white text-xs`}>
                    {doc.type}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h3 className="font-medium text-sm mb-2 line-clamp-2">{doc.name}</h3>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{doc.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uploaded:</span>
                  <span>{doc.uploadDate}</span>
                </div>
                {doc.jobId && (
                  <div className="flex justify-between">
                    <span>Job:</span>
                    <span>{doc.jobId}</span>
                  </div>
                )}
                {doc.customerId && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{doc.customerId}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <Card className="card-professional">
          <CardContent className="text-center py-12">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== 'all' 
                ? "Try adjusting your search or filter criteria."
                : "Upload your first document to get started."
              }
            </p>
            {!searchTerm && typeFilter === 'all' && (
              <Button onClick={() => setIsUploadOpen(true)} className="btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Storage Summary */}
      <Card className="card-professional">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold">47.3 MB</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
          </div>
          <div className="mt-4 bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '23%' }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">23% of 200 MB used</p>
        </CardContent>
      </Card>
    </div>
  );
};