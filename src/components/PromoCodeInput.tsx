// src/components/PromoCodeInput.tsx
import React, { useState } from 'react';
import { Box, TextField, Button, Chip, Paper, Typography, alpha, Alert } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface PromoCodeInputProps {
  onApply: (code: string, discount: number) => void;
  onRemove: () => void;
}

const PromoCodeInput: React.FC<PromoCodeInputProps> = ({ onApply, onRemove }) => {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discountInfo, setDiscountInfo] = useState<{percent: number, influencer: string} | null>(null);

const validateCode = async () => {
  setLoading(true);
  setError('');
  try {
    const response = await fetch(`${API_BASE_URL}/api/validate-promo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await response.json();
    if (data.valid) {
      setApplied(true);
      setDiscountInfo({
        percent: data.discount_percent,          // <-- use this
        influencer: data.influencer_name || 'promoter'
      });
      onApply(code, data.discount_percent);
    } else {
      setError(data.message || 'Invalid promo code');
    }
  } catch (err) {
    setError('Error validating code');
  } finally {
    setLoading(false);
  }
};

  const handleRemove = () => {
    setApplied(false);
    setCode('');
    setDiscountInfo(null);
    onRemove();
  };

  return (
    <Paper sx={{ p: 3, bgcolor: alpha('#3b82f6', 0.05) }}>
      <Typography variant="h6" gutterBottom>
        Have an influencer promo code?
      </Typography>
      
      {!applied ? (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter code (e.g., JOHNDOE10)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            error={!!error}
            helperText={error}
            disabled={loading}
          />
          <Button 
            variant="contained"
            onClick={validateCode}
            disabled={!code || loading}
          >
            {loading ? 'Validating...' : 'Apply'}
          </Button>
        </Box>
      ) : (
        <Box>
          <Chip
            icon={<CheckIcon />}
            label={`${discountInfo?.percent}% off from ${discountInfo?.influencer}`}
            color="success"
            onDelete={handleRemove}
            sx={{ mb: 2 }}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ✅ You'll get {discountInfo?.percent}% off your first month!
              <br />
              <strong>{discountInfo?.influencer} will earn 10% on all your future renewals!</strong>
            </Typography>
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default PromoCodeInput;
