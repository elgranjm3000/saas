import { useParams } from 'next/navigation';
import SalesOperationForm from '@/components/forms/sales-operation-form';

const EditSalesOperationPage = () => {
  const params = useParams();
  const operationId = params?.id ? Number(params.id) : undefined;

  return <SalesOperationForm operationId={operationId} isEdit={true} />;
};

export default EditSalesOperationPage;
