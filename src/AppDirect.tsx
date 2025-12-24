import { useState, useEffect } from 'react';
import { LazorkitProvider, useWallet } from '@lazorkit/wallet';
import { Loader2, Wallet, Send, Copy, CheckCircle, LogOut, RefreshCw, ExternalLink } from 'lucide-react';
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// LazorKit Configuration (using official defaults for Devnet)
const LAZORKIT_CONFIG = {
  rpcUrl: 'https://api.devnet.solana.com',
  portalUrl: 'https://portal.lazor.sh',
  paymasterConfig: {
    paymasterUrl: 'https://kora.devnet.lazorkit.com'
  }
} as const;

function ConnectButton() {
  const { connect, disconnect, isConnected, isConnecting, wallet } = useWallet();

  if (isConnected && wallet) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20"
      >
        <LogOut className="w-4 h-4" />
        <span>Disconnect ({wallet.smartWallet.slice(0, 6)}...)</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => connect()}
      disabled={isConnecting}
      className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Wallet className="w-5 h-5" />
          <span>Connect Wallet</span>
        </>
      )}
    </button>
  );
}

function WalletDashboard({ onGoHome }: { onGoHome: () => void }) {
  const { smartWalletPubkey, signAndSendTransaction, disconnect, wallet, isConnected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState('');
  const [sending, setSending] = useState(false);
  const [connection] = useState(() => new Connection(LAZORKIT_CONFIG.rpcUrl, 'confirmed'));

  useEffect(() => {
    if (smartWalletPubkey) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [smartWalletPubkey]);

  const refreshBalance = async () => {
    if (!smartWalletPubkey) return;
    try {
      const balanceLamports = await connection.getBalance(smartWalletPubkey);
      setBalance(balanceLamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Balance refresh error:', error);
    }
  };

  const copyAddress = () => {
    if (smartWalletPubkey) {
      navigator.clipboard.writeText(smartWalletPubkey.toString());
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
      if (!smartWalletPubkey) {
        throw new Error('Wallet not connected');
      }

      if (!isConnected || !wallet) {
        throw new Error('Please reconnect your wallet');
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

      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports: amountNum * LAMPORTS_PER_SOL,
      });

      console.log('Attempting to sign transaction...', {
        from: smartWalletPubkey.toString(),
        to: recipientPubkey.toString(),
        amount: amountNum,
        lamports: amountNum * LAMPORTS_PER_SOL,
        walletConnected: isConnected,
        hasWallet: !!wallet
      });

      // LazorKit will open a portal for passkey signing
      // Using transactionOptions to optimize transaction size and enable V0 transaction support
      const signature = await signAndSendTransaction({
        instructions: [instruction],
        transactionOptions: {
          computeUnitLimit: 200000, // Set appropriate compute units
          addressLookupTableAccounts: [], // Enable V0 transaction format
          clusterSimulation: 'devnet' as const, // Specify cluster for simulation
        },
      });

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
        if (err.message.includes('Signing failed')) {
          errorMessage = 'Signing failed. Please ensure you authenticate with your passkey.';
        } else if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled.';
        } else if (err.message.includes('Transaction too large') || err.message.includes('too large')) {
          errorMessage = 'Transaction too large. The transaction has been optimized with V0 format. If this persists, please try a smaller amount or contact support.';
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
              <p className="text-blue-200 text-sm">Direct Integration</p>
            </div>
          </button>
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all border border-white/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Balance</h2>
            <button
              onClick={refreshBalance}
              disabled={!smartWalletPubkey}
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
                {smartWalletPubkey?.toString() || 'Loading...'}
              </code>
              <button
                onClick={copyAddress}
                disabled={!smartWalletPubkey}
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
            disabled={!smartWalletPubkey || balance === null || balance === 0}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span>Send SOL</span>
          </button>
        </div>

        {smartWalletPubkey && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
            <div className="space-y-2">
              <a
                href={`https://explorer.solana.com/address/${smartWalletPubkey.toString()}?cluster=devnet`}
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

function WelcomeScreen() {
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
            <p className="text-blue-300 text-xs mt-2">Direct Integration Example</p>
          </div>

          <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <p className="text-blue-100 text-sm">
              Connect your wallet using biometric authentication (Face ID, Touch ID, or Windows Hello)
            </p>
          </div>

          <div className="flex justify-center">
            <ConnectButton />
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

function AppContent({ onGoHome }: { onGoHome: () => void }) {
  const { isConnected, isConnecting } = useWallet();

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-lg">Connecting wallet...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <WelcomeScreen />;
  }

  return <WalletDashboard onGoHome={onGoHome} />;
}

function AppDirect({ onGoHome }: { onGoHome: () => void }) {
  return (
    <LazorkitProvider
      rpcUrl={LAZORKIT_CONFIG.rpcUrl}
      portalUrl={LAZORKIT_CONFIG.portalUrl}
      paymasterConfig={LAZORKIT_CONFIG.paymasterConfig}
    >
      <AppContent onGoHome={onGoHome} />
    </LazorkitProvider>
  );
}

export default AppDirect;

