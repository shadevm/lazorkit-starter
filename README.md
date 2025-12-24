# LazorKit Integration Examples

A showcase project demonstrating **two different approaches** to integrate [LazorKit](https://docs.lazorkit.com/) - a passwordless Solana smart wallet using passkeys.

## 🎯 What's Inside

This project includes **two complete implementations** of the same wallet application:

### 1️⃣ Direct Integration (`AppDirect.tsx`)
- Uses `LazorkitProvider` component
- Direct access to LazorKit's custom hooks
- Simpler setup for LazorKit-only applications
- Based on [React SDK docs](https://docs.lazorkit.com/react-sdk/getting-started)

### 2️⃣ Wallet Standard (`AppWalletStandard.tsx`)
- Uses `registerLazorkitWallet()` with Solana Wallet Adapter
- Compatible with other wallets (Phantom, Solflare, etc.)
- Standard interface for multi-wallet support
- Based on [Wallet Standard docs](https://docs.lazorkit.com/wallet-standard)

## ✨ Features

- 🔐 Passwordless authentication via WebAuthn (Face ID, Touch ID, Windows Hello)
- 👛 Solana smart wallet with automatic creation
- 💸 Send SOL transactions
- 🎨 Beautiful, modern UI with Tailwind CSS
- 🔄 Easy switching between integration approaches
- ⚡ Built with React + TypeScript + Vite

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A modern browser with WebAuthn support (Chrome, Safari, Edge, Firefox)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173` (or the URL shown in terminal).

⚠️ **Important:** Make sure to use `localhost` or `127.0.0.1` for WebAuthn to work properly.

### Build

```bash
npm run build
```

## 📖 How to Use

1. **Choose Integration Type** - Select either "Direct Integration" or "Wallet Standard" from the landing page
2. **Connect Wallet** - Click connect and authenticate with your biometric
3. **Send Transactions** - Try sending SOL to test the integration

## 🏗️ Project Structure

```
src/
├── App.tsx                  # Landing page with integration selector
├── AppDirect.tsx           # Direct Integration implementation
├── AppWalletStandard.tsx   # Wallet Standard implementation
├── main.tsx                # React entry point
└── index.css               # Styles
```

## 🔧 Implementation Details

### Direct Integration

```typescript
// Wrap your app with LazorkitProvider
<LazorkitProvider
  rpcUrl="https://api.devnet.solana.com"
  portalUrl="https://portal.lazor.sh"
  paymasterConfig={{ paymasterUrl: "..." }}
>
  <YourApp />
</LazorkitProvider>

// Use the custom hook
const { smartWalletPubkey, signAndSendTransaction } = useWallet();
```

### Wallet Standard

```typescript
// Register LazorKit on mount
useEffect(() => {
  registerLazorkitWallet({
    rpcUrl: "https://api.devnet.solana.com",
    portalUrl: "https://portal.lazor.sh",
    paymasterConfig: { paymasterUrl: "..." },
    clusterSimulation: "devnet",
  });
}, []);

// Use standard Solana wallet adapter
const { publicKey, sendTransaction } = useWallet();
```

## 🎨 Tech Stack

- **LazorKit SDK** - Wallet and authentication
- **Solana Wallet Adapter** - Standard wallet interface (Wallet Standard only)
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Solana Web3.js** - Blockchain interactions

## 📚 Documentation

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [React SDK Getting Started](https://docs.lazorkit.com/react-sdk/getting-started)
- [Wallet Standard Integration](https://docs.lazorkit.com/wallet-standard)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Solana Devnet Faucet](https://faucet.solana.com)

## 🐛 Troubleshooting

### "Signing failed" or WebAuthn errors

Make sure you're accessing the app on `http://localhost` or `http://127.0.0.1`. WebAuthn doesn't work on:
- Domains with invalid SSL certificates
- IP addresses other than 127.0.0.1
- Custom hostnames without proper SSL

### Clear cached credentials

If you're experiencing issues with old credentials:

1. **Delete passkeys from system settings**
   - Mac: System Settings → Passwords
   - Windows: Settings → Accounts → Passkey settings
   - Chrome: `chrome://settings/passkeys`

2. **Clear browser storage**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

3. **Reconnect** to create fresh credentials

### Switching between implementations

Each implementation is isolated. You can safely test both without conflicts. Just use the landing page to switch between them.

## 🤝 Contributing

This is a showcase/example project. Feel free to fork and modify for your own needs!

## 📄 License

MIT

---

**Built with ❤️ to showcase LazorKit integration patterns**
