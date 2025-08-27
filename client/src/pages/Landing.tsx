import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import logoUrl from '../assets/cyberpunk-shark.png';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="login-container rounded-2xl border border-border glow-effect bg-card/20 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-effect overflow-hidden">
                <img 
                  src={logoUrl} 
                  alt="Shark Loto Logo" 
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent shark-brand">
                Shark Loto 💵
              </h1>
              <p className="text-muted-foreground mt-2">
                Análise Inteligente de Loterias com IA
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-accent">
                  🚀 Experiência Única e Exclusiva
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O Shark Loto utiliza inteligência artificial avançada para analisar padrões históricos, 
                  identificar números quentes 🔥 e frios 🥶, gerando combinações otimizadas que maximizam 
                  suas chances de sucesso nas loterias brasileiras.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="text-2xl">🎯</div>
                  <p className="text-xs text-muted-foreground">Análise<br/>Precisa</p>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl">🧠</div>
                  <p className="text-xs text-muted-foreground">IA<br/>Avançada</p>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl">🏆</div>
                  <p className="text-xs text-muted-foreground">Resultados<br/>Comprovados</p>
                </div>
              </div>

              <Button 
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 rounded-lg font-semibold glow-effect hover:scale-105 transition-transform"
                data-testid="button-login"
              >
                Entrar e Começar
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  🔒 Seus dados são privados e seguros<br/>
                  Nenhuma informação é compartilhada
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            powered by <span className="text-accent font-semibold shark-brand">Shark062</span>
          </p>
        </div>
      </div>
    </div>
  );
}
