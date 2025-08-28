import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, Heart, ExternalLink, CheckCircle } from 'lucide-react';

const PixDonationButton: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const pixKey = "00020101021126580014br.gov.bcb.pix01365d237461-0a79-4ff3-9c8d-40afadf909b15204000053039865802BR5921ALEX BARBOSA DE SOUSA6007GOIANIA62070503***63049872";

  const handlePixDonation = async () => {
    try {
      // Copiar chave PIX para clipboard
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      
      toast({
        title: "✅ Chave PIX Copiada!",
        description: "A chave foi copiada para seu clipboard. Redirecionando para o banco...",
        duration: 3000,
      });

      // Tentar abrir apps de banco mais populares do Brasil
      const bankApps = [
        'nubank://', // Nubank
        'itau://', // Itaú
        'bradesco://', // Bradesco
        'santander://', // Santander
        'caixa://', // Caixa
        'bbapp://', // Banco do Brasil
        'inter://', // Inter
        'c6bank://', // C6 Bank
        'original://', // Banco Original
        'next://', // Next
        'picpay://' // PicPay
      ];

      // Tentar abrir o primeiro app disponível
      let appOpened = false;
      for (const appUrl of bankApps) {
        try {
          window.location.href = appUrl;
          appOpened = true;
          break;
        } catch (error) {
          // App não instalado, tentar próximo
          continue;
        }
      }

      // Se nenhum app foi aberto, mostrar instruções
      if (!appOpened) {
        setTimeout(() => {
          toast({
            title: "📱 Abra seu App do Banco",
            description: "Cole a chave PIX copiada no seu aplicativo bancário para fazer a doação.",
            duration: 5000,
          });
        }, 1000);
      }

      // Resetar estado após 3 segundos
      setTimeout(() => setCopied(false), 3000);
      
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível copiar a chave. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-yellow-500/10 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20">
      {/* Efeito de brilho animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-pulse" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center space-x-4">
          {/* Ícone PIX animado */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-yellow-400 rounded-xl flex items-center justify-center animate-pulse">
              <Heart className="w-6 h-6 text-white" />
            </div>
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-bold text-white">💚 Apoie o Shark Loto</h3>
              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full">
                PIX
              </span>
            </div>
            
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              Ajude a manter nossa plataforma funcionando com análises em tempo real e melhorias constantes. 
              Sua contribuição mantém o sistema gratuito para todos os usuários!
            </p>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handlePixDonation}
                className={`
                  flex-1 bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 
                  text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 
                  transform hover:scale-105 hover:shadow-lg
                  ${copied ? 'from-green-600 to-green-600' : ''}
                `}
                data-testid="button-pix-donation"
              >
                <div className="flex items-center space-x-2">
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Fazer Doação PIX</span>
                    </>
                  )}
                  <ExternalLink className="w-4 h-4" />
                </div>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Informações adicionais */}
        <div className="mt-4 pt-4 border-t border-green-500/20">
          <div className="flex items-center justify-between text-xs text-green-400">
            <span>🔒 Transação 100% segura</span>
            <span>⚡ Contribuição instantânea</span>
            <span>🎯 Melhoria contínua</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PixDonationButton;