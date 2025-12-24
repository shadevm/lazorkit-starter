import { useState } from 'react';
import { Wallet, Zap, ArrowRight } from 'lucide-react';
import AppDirect from './AppDirect';
import AppWalletStandard from './AppWalletStandard';

type IntegrationMode = 'select' | 'direct' | 'wallet-standard';

function App() {
  const [mode, setMode] = useState<IntegrationMode>('select');

  if (mode === 'direct') {
    return <AppDirect onGoHome={() => setMode('select')} />;
  }

  if (mode === 'wallet-standard') {
    return <AppWalletStandard onGoHome={() => setMode('select')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
              <Wallet className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">LazorKit Integration Examples</h1>
          <p className="text-blue-200 text-lg">
            Choose your integration approach
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Direct Integration */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 hover:border-blue-500/50 transition-all flex flex-col">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Direct Integration</h2>
                <p className="text-blue-200 text-sm">Using LazorkitProvider</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <p className="text-blue-100 text-sm">
                  Direct access to LazorKit SDK hooks
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <p className="text-blue-100 text-sm">
                  Simple setup with LazorkitProvider
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <p className="text-blue-100 text-sm">
                  Uses useWallet from @lazorkit/wallet
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <p className="text-blue-100 text-sm">
                  Best for LazorKit-only applications
                </p>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 flex-grow">
              <code className="text-xs text-blue-300 font-mono">
                <div className="text-purple-400">{'<LazorkitProvider'}</div>
                <div className="pl-4">{'rpcUrl={...}'}</div>
                <div className="pl-4">{'portalUrl={...}'}</div>
                <div className="pl-4">{'paymasterConfig={...}'}</div>
                <div className="text-purple-400">{'>'}</div>
              </code>
            </div>

            <button
              onClick={() => setMode('direct')}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
            >
              <span>Try Direct Integration</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Wallet Standard Integration */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 hover:border-cyan-500/50 transition-all flex flex-col">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Wallet Standard</h2>
                <p className="text-blue-200 text-sm">Using Solana Wallet Adapter</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                <p className="text-blue-100 text-sm">
                  Compatible with standard wallet adapter
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                <p className="text-blue-100 text-sm">
                  Works alongside Phantom, Solflare, etc.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                <p className="text-blue-100 text-sm">
                  Uses registerLazorkitWallet()
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></div>
                <p className="text-blue-100 text-sm">
                  Best for multi-wallet applications
                </p>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 flex-grow">
              <code className="text-xs text-cyan-300 font-mono">
                <div className="text-cyan-400">{'registerLazorkitWallet({'}</div>
                <div className="pl-4">{'rpcUrl, portalUrl,'}</div>
                <div className="pl-4">{'paymasterConfig'}</div>
                <div className="text-cyan-400">{'});'}</div>
              </code>
            </div>

            <button
              onClick={() => setMode('wallet-standard')}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
            >
              <span>Try Wallet Standard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-8 p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
          <p className="text-blue-200 text-sm text-center">
            💡 <strong>Tip:</strong> Both examples use the same LazorKit SDK and provide identical functionality.
            Choose the approach that best fits your project architecture.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-blue-300 text-xs">
            Learn more at{' '}
            <a
              href="https://docs.lazorkit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-200"
            >
              docs.lazorkit.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
