import { Card, Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const navigate = useNavigate();
  return (
    <Card>
      <Result
        status="info"
        title={title}
        subTitle={description}
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
        }
      />
    </Card>
  );
}