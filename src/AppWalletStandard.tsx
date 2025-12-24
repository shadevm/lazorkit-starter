import { useState, useEffect, useMemo } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { registerLazorkitWallet } from '@lazorkit/wallet';
import { Loader2, Wallet, Send, Copy, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// LazorKit Configuration (using official defaults for Devnet)
const CONFIG = {
  RPC_URL: 'https://api.devnet.solana.com',
  PORTAL_URL: 'https://portal.lazor.sh',
  PAYMASTER: {
    paymasterUrl: 'https://kora.devnet.lazorkit.com'
  },
  CLUSTER: 'devnet'
} as const;

function WalletDashboard({ onGoHome }: { onGoHome: () => void }) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState('');
  const [sending, setSending] = useState(false);
  const [connection] = useState(() => new Connection(CONFIG.RPC_URL, 'confirmed'));

  useEffect(() => {
    if (publicKey) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [publicKey]);

  const refreshBalance = async () => {
    if (!publicKey) return;
    try {
      const balanceLamports = await connection.getBalance(publicKey);
      setBalance(balanceLamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Balance refresh error:', error);
    }
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError('');
    setTxHash(null);
    setSending(true);

    try {
      if (!publicKey || !connected) {
        throw new Error('Wallet not connected');
      }

      const recipientPubkey = new PublicKey(recipient.trim());
      const amountNum = parseFloat(amount);

      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }

      // Reserve some SOL for rent-exempt minimum (~0.001 SOL)
      const RENT_RESERVE = 0.001;
      const maxSendable = Math.max(0, (balance || 0) - RENT_RESERVE);

      if (balance !== null && amountNum > balance) {
        throw new Error('Insufficient balance');
      }

      if (balance !== null && amountNum > maxSendable) {
        throw new Error(`Amount too high. Keep at least ${RENT_RESERVE} SOL for rent. Max sendable: ${maxSendable.toFixed(4)} SOL`);
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: amountNum * LAMPORTS_PER_SOL,
        })
      );

      console.log('Attempting to send transaction...', {
        from: publicKey.toString(),
        to: recipientPubkey.toString(),
        amount: amountNum,
        lamports: amountNum * LAMPORTS_PER_SOL,
      });

      // LazorKit handles paymaster logic internally
      const signature = await sendTransaction(transaction, connection);

      console.log('Transaction successful:', signature);

      setTxHash(signature);
      setRecipient('');
      setAmount('');
      await refreshBalance();
    } catch (err) {
      console.error('Transaction failed:', err);
      let errorMessage = 'Transaction failed';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled.';
        } else if (err.message.includes('Signing failed')) {
          errorMessage = 'Signing failed. Please ensure you authenticate with your passkey.';
        } else if (err.message.includes('Transaction too large') || err.message.includes('too large')) {
          errorMessage = 'Transaction too large. If this persists, please try a smaller amount or contact support.';
        } else if (err.message.includes('custom program error: 0x1') || err.message.includes('custom program error: 0x2')) {
          errorMessage = `Insufficient funds. Your balance: ${balance?.toFixed(4) || '0'} SOL. You need to keep at least 0.001 SOL for rent. Try a smaller amount or fund your wallet using the faucet.`;
        } else if (err.message.includes('Attempt to debit an account but found no record of a prior credit')) {
          errorMessage = 'Account not funded. Please add SOL to your wallet using the faucet.';
        } else if (err.message.includes('Transaction simulation failed')) {
          errorMessage = 'Transaction simulation failed. This may be due to insufficient funds or network issues. Please check your balance and try again.';
        }
      }
      
      setTxError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">LazorKit Wallet</h1>
              <p className="text-blue-200 text-center">Passwordless Solana wallet powered by passkeys</p>
              <p className="text-blue-300 text-xs mt-2">Wallet Standard Example</p>
            </div>

            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <p className="text-blue-100 text-sm">
                Connect your wallet using biometric authentication (Face ID, Touch ID, or Windows Hello)
              </p>
            </div>

            <div className="flex justify-center">
              <WalletMultiButton className="!bg-gradient-to-r !from-blue-500 !to-cyan-500 hover:!from-blue-600 hover:!to-cyan-600" />
            </div>

            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-blue-200 text-xs text-center">
                Secured by WebAuthn and LazorKit smart wallets.
                <br />
                Your biometric data never leaves your device.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onGoHome}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">LazorKit Wallet</h1>
              <p className="text-blue-200 text-sm">Wallet Standard</p>
            </div>
          </button>
          <WalletMultiButton className="!bg-white/10 hover:!bg-white/20 !border !border-white/20" />
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Balance</h2>
            <button
              onClick={refreshBalance}
              disabled={!publicKey}
              className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5 text-blue-300" />
            </button>
          </div>

          <div className="mb-6">
            <div className="text-4xl font-bold text-white mb-1">
              {balance !== null ? balance.toFixed(4) : '---'} SOL
            </div>
            {balance !== null && balance === 0 && (
              <div className="text-blue-200 text-sm">
                Fund your wallet using the{' '}
                <a
                  href="https://faucet.solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-100"
                >
                  Solana Faucet
                </a>
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-lg p-4 mb-4">
            <p className="text-blue-200 text-sm mb-2">Smart Wallet Address</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-white text-sm font-mono break-all">
                {publicKey?.toString() || 'Loading...'}
              </code>
              <button
                onClick={copyAddress}
                disabled={!publicKey}
                className="p-2 hover:bg-white/10 rounded-lg transition-all flex-shrink-0 disabled:opacity-50"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-blue-300" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowSendModal(true)}
            disabled={!publicKey || balance === null || balance === 0}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span>Send SOL</span>
          </button>
        </div>

        {publicKey && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
            <div className="space-y-2">
              <a
                href={`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              >
                <ExternalLink className="w-5 h-5 text-blue-300" />
                <span className="text-white">View on Solana Explorer</span>
              </a>
              <a
                href="https://faucet.solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              >
                <ExternalLink className="w-5 h-5 text-blue-300" />
                <span className="text-white">Get Devnet SOL from Faucet</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">Send SOL</h3>

            {!txHash && !txError && (
              <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-100 text-xs">
                  💡 You'll be prompted to sign with your passkey.
                </p>
              </div>
            )}

            {txHash ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <p className="text-green-200 font-medium">Transaction Successful!</p>
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-300 hover:text-green-200 text-sm"
                  >
                    <span className="break-all">{txHash.slice(0, 20)}...</span>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                </div>
                <button
                  onClick={() => {
                    setShowSendModal(false);
                    setTxHash(null);
                  }}
                  className="w-full bg-white/10 text-white py-3 px-4 rounded-lg font-medium hover:bg-white/20 transition-all border border-white/20"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendTransaction} className="space-y-4">
                {txError && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-200 text-sm">{txError}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-blue-200 mb-2">
                    Recipient Address
                  </label>
                  <input
                    id="recipient"
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter Solana address"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    disabled={sending}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-blue-200 mb-2">
                    Amount (SOL)
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.0001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                    required
                  />
                  {balance !== null && (
                    <div className="text-blue-300 text-sm mt-1">
                      <p>Available: {balance.toFixed(4)} SOL</p>
                      <p className="text-blue-400 text-xs">Max sendable: {Math.max(0, balance - 0.001).toFixed(4)} SOL (keeping 0.001 for rent)</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSendModal(false);
                      setTxError('');
                      setRecipient('');
                      setAmount('');
                    }}
                    disabled={sending}
                    className="flex-1 bg-white/10 text-white py-3 px-4 rounded-lg font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Signing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  // Register LazorKit wallet on mount
  useEffect(() => {
    registerLazorkitWallet({
      rpcUrl: CONFIG.RPC_URL,
      portalUrl: CONFIG.PORTAL_URL,
      paymasterConfig: CONFIG.PAYMASTER,
      clusterSimulation: CONFIG.CLUSTER,
    });
  }, []);

  const wallets = useMemo(
    () => [
      // LazorKit will be automatically detected after registration
      // Other standard wallets (Phantom, Solflare, etc.) would also appear here
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={CONFIG.RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function AppWalletStandard({ onGoHome }: { onGoHome: () => void }) {
  return (
    <AppProviders>
      <WalletDashboard onGoHome={onGoHome} />
    </AppProviders>
  );
}

export default AppWalletStandard;

