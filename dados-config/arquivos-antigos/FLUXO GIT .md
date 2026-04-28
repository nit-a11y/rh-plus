🔄 Workflow de Manutenção
1. Desenvolvimento Local (sua máquina)
bash
# Faça as alterações no código
# Teste localmente: npm start
# Acesse: http://localhost:3001
2. Commit e Push (enviar para GitHub)
bash
git add .
git commit -m "Descrição da alteração"
git push
3. Deploy na VPS (puxar alterações)
bash
ssh root@147.93.10.11
cd /var/www/sistemas/pesquisa-clima
git pull
pm2 restart pesquisa-clima
⚡ Comando Único para Deploy Rápido
Na VPS, você pode fazer tudo em um comando:

bash
cd /var/www/sistemas/pesquisa-clima && git pull && pm2 restart pesquisa-clima
Ou criar um alias no ~/.bashrc:

bash
alias deploy-pesquisa='cd /var/www/sistemas/pesquisa-clima && git pull && pm2 restart pesquisa-clima'
Depois é só digitar: deploy-pesquisa

📋 Checklist de Manutenção
Etapa	Local	Comando
Desenvolver	PC Local	npm start
Testar	PC Local	http://localhost:3001
Commitar	PC Local	git commit -m "..."
Push	PC Local	git push
Pull	VPS	git pull
Reiniciar	VPS	pm2 restart pesquisa-clima
Esse é o fluxo padrão de trabalho com Git! 🚀