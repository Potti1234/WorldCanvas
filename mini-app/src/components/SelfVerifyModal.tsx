import React from 'react'
import { Button } from '@/components/ui/button'
import { SelfQRcode } from '@selfxyz/qrcode'

interface SelfVerifyModalProps {
  selfApp: any
  qrUrl: string
  onSuccess: () => void
  onError: () => void
  onClose: () => void
}

export const SelfVerifyModal: React.FC<SelfVerifyModalProps> = ({
  selfApp,
  qrUrl,
  onSuccess,
  onError,
  onClose
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '2rem',
        zIndex: 100,
        border: '1px solid black',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}
    >
      <h2 style={{ color: 'black' }}>Verify with Self</h2>
      <p style={{ color: 'black' }}>
        Scan the QR code with your Self app to continue.
      </p>
      <SelfQRcode
        selfApp={selfApp}
        onSuccess={onSuccess}
        onError={onError}
        size={250}
      />
      <p style={{ color: 'black' }}>Or use the link on your mobile:</p>
      <a href={qrUrl} target='_blank' rel='noopener noreferrer'>
        <Button>Verify on Mobile</Button>
      </a>
      <Button onClick={onClose} variant='secondary'>
        Close
      </Button>
    </div>
  )
}
