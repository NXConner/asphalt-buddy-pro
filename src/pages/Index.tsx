import AsphaltEstimator from '@/components/AsphaltEstimator';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-end mb-2">
          <Link to="/overwatch" className="text-sm underline">
            Go to OverWatch
          </Link>
        </div>
        <AsphaltEstimator />
      </div>
    </div>
  );
};

export default Index;
