import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Heart, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PixDonationButton: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const pixKey = "00020101021126580014br.gov.bcb.pix01365d237461-0a79-4ff3-9c8d-40afadf909b152040000530398654040.015802BR5921ALEX BARBOSA DE SOUSA6007GOIANIA62070503***63049872";

  const handlePixDonation = () => {
    const pixKey = "01234567890"; // Substitua pela sua chave PIX real
    const amount = "5.00"; // Valor sugerido
    const description = "Doação para o Cyberpunk Shark Lottery";

    // Cria uma URL PIX padrão que pode ser interpretada por qualquer banco
    const pixUrl = `https://nubank.com.br/pagar/${pixKey}/${amount}`;

    // Lista de esquemas de deep linking para apps bancários
    const bankSchemes = [
      `nubank://qrauth?uuid=${pixKey}`,
      `inter://pix?qr=${pixKey}`,
      `bradesco://pix?key=${pixKey}&amount=${amount}`,
      `itau://pix?code=${pixKey}`,
      `santander://pix?key=${pixKey}`,
      `bb://pix?chave=${pixKey}`,
      `caixa://pix?code=${pixKey}`,
      `picpay://pix?key=${pixKey}&value=${amount}`,
      `99://pix?key=${pixKey}`
    ];

    // Função para tentar abrir apps
    const tryOpenBankApp = () => {
      let tried = false;

      // Detecta se é mobile ou desktop
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // Em mobile, tenta abrir apps bancários
        bankSchemes.forEach((scheme, index) => {
          setTimeout(() => {
            try {
              // Cria um iframe invisível para tentar abrir o app
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = scheme;
              document.body.appendChild(iframe);

              // Remove o iframe após tentar
              setTimeout(() => {
                document.body.removeChild(iframe);
              }, 1000);
            } catch (error) {
              console.log(`Tentativa ${index + 1} falhou`);
            }
          }, index * 100);
        });

        // Fallback: abre a página web do banco após 2 segundos
        setTimeout(() => {
          window.open(`https://nubank.com.br/pagar`, '_blank');
        }, 2000);
      } else {
        // Em desktop, abre diretamente a página web
        window.open(`https://nubank.com.br/pagar`, '_blank');
      }

      // Sempre copia a chave PIX para facilitar
      navigator.clipboard.writeText(pixKey).then(() => {
        toast({
          title: "Chave PIX copiada! 📋",
          description: `Chave ${pixKey} copiada. Cole no seu app bancário.`,
          duration: 5000,
        });
      }).catch(() => {
        // Fallback se não conseguir copiar
        toast({
          title: "Chave PIX 📋",
          description: `Use a chave: ${pixKey}`,
          duration: 7000,
        });
      });
    };

    tryOpenBankApp();
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

            <div className="space-y-2">
              <Button
                onClick={handlePixDonation}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 transition-all duration-300 transform hover:scale-105"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Doar via PIX
              </Button>

              <Button
                onClick={() => {
                  const pixKey = "01234567890";
                  navigator.clipboard.writeText(pixKey).then(() => {
                    toast({
                      title: "Chave PIX copiada! 📋",
                      description: `${pixKey} - Cole no seu app bancário`,
                      duration: 5000,
                    });
                  });
                }}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copiar chave PIX
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