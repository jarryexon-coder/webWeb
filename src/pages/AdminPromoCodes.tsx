// src/pages/AdminPromoCodes.tsx
const AdminPromoCodes: React.FC = () => {
  const [influencerName, setInfluencerName] = useState('');
  const [discount, setDiscount] = useState(10);
  const [generatedCode, setGeneratedCode] = useState('');

  const createPromo = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_PYTHON}/api/admin/create-promo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        influencer_name: influencerName,
        discount_percent: discount,
        commission_rate: 10
      })
    });
    
    const data = await response.json();
    setGeneratedCode(data.promo_code);
  };

  return (
    <Container>
      <Typography variant="h4">Create Influencer Promo Code</Typography>
      <TextField 
        label="Influencer Name"
        value={influencerName}
        onChange={(e) => setInfluencerName(e.target.value)}
      />
      <TextField 
        label="Discount %"
        type="number"
        value={discount}
        onChange={(e) => setDiscount(Number(e.target.value))}
      />
      <Button onClick={createPromo}>Generate Code</Button>
      
      {generatedCode && (
        <Alert severity="success">
          Promo code created: <strong>{generatedCode}</strong>
          <br />
          Give this code to {influencerName} to share with their audience!
        </Alert>
      )}
    </Container>
  );
};
