/**
 * 🧠 TALENT MATCHER - Algoritmo Inteligente de Matching
 * Módulo dedicado para análise e matching de candidatos do banco de talentos
 * com vagas abertas.
 */

class TalentMatcher {
    constructor() {
        // Pesos ajustáveis via treinamento
        this.weights = this.loadWeights() || {
            position: 0.35,      // Cargo/pretensão (35%)
            sector: 0.25,        // Setor (25%)
            unit: 0.20,          // Unidade (20%)
            skills: 0.15,        // Habilidades (15%)
            experience: 0.05     // Experiência (5%)
        };
        this.minScore = 0.60; // Score mínimo para considerar compatível (60%)
        
        // Feedback history para treinamento
        this.feedbackHistory = this.loadFeedback() || [];
        this.trainingStats = this.loadTrainingStats() || {
            totalFeedback: 0,
            positiveFeedback: 0,
            negativeFeedback: 0,
            accuracy: 0
        };
        
        // Limite de ajuste por feedback (evita mudanças drásticas)
        this.adjustmentRate = 0.02;
    }
    
    // ==================== SISTEMA DE TREINAMENTO ====================
    
    /**
     * Registra feedback do usuário sobre um match
     * @param {string} talentId - ID do talento
     * @param {string} jobId - ID da vaga
     * @param {number} predictedScore - Score previsto pelo algoritmo
     * @param {boolean} wasGoodMatch - O match foi bom na prática?
     * @param {string} feedback - Comentário opcional
     */
    registerFeedback(talentId, jobId, predictedScore, wasGoodMatch, feedback = '') {
        const entry = {
            id: this.generateId(),
            talentId,
            jobId,
            predictedScore,
            wasGoodMatch,
            feedback,
            timestamp: new Date().toISOString()
        };
        
        this.feedbackHistory.push(entry);
        this.trainingStats.totalFeedback++;
        
        if (wasGoodMatch) {
            this.trainingStats.positiveFeedback++;
        } else {
            this.trainingStats.negativeFeedback++;
        }
        
        // Calcular acurácia
        this.trainingStats.accuracy = Math.round(
            (this.trainingStats.positiveFeedback / this.trainingStats.totalFeedback) * 100
        );
        
        this.saveFeedback();
        this.saveTrainingStats();
        
        // Ajustar pesos baseado no feedback
        if (this.trainingStats.totalFeedback >= 5) {
            this.adjustWeightsBasedOnFeedback();
        }
        
        console.log(`🎯 Feedback registrado: ${wasGoodMatch ? '✅ Match bom' : '❌ Match ruim'} (Score previsto: ${predictedScore}%)`);
        
        return entry;
    }
    
    /**
     * Ajusta pesos automaticamente baseado no histórico de feedback
     */
    adjustWeightsBasedOnFeedback() {
        const recentFeedback = this.feedbackHistory.slice(-20); // Últimos 20 feedbacks
        
        // Analisar quais fatores correlacionam com matches bem-sucedidos
        const factorPerformance = {
            position: { good: 0, total: 0 },
            sector: { good: 0, total: 0 },
            unit: { good: 0, total: 0 },
            skills: { good: 0, total: 0 },
            experience: { good: 0, total: 0 }
        };
        
        // Simulação: em uma implementação real, você teria os scores individuais
        // aqui estamos usando uma heurística baseada na precisão geral
        
        const accuracy = this.trainingStats.accuracy / 100;
        
        // Se a acurácia está baixa (< 70%), ajustar pesos
        if (accuracy < 0.70) {
            // Reduzir peso do cargo e aumentar peso das skills
            this.weights.position = Math.max(0.20, this.weights.position - this.adjustmentRate);
            this.weights.skills = Math.min(0.30, this.weights.skills + this.adjustmentRate);
            
            console.log('🔄 Pesos ajustados: cargo↓ skills↑ (tentando melhorar acurácia)');
        } else if (accuracy > 0.85) {
            // Acurácia boa, manter ou ajustar sutilmente
            console.log('✅ Acurácia boa, mantendo pesos atuais');
        }
        
        // Normalizar pesos para somar 1.0
        this.normalizeWeights();
        this.saveWeights();
    }
    
    /**
     * Normaliza pesos para somarem 1.0
     */
    normalizeWeights() {
        const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
        for (let key in this.weights) {
            this.weights[key] = this.weights[key] / sum;
        }
    }
    
    /**
     * Permite ajuste manual dos pesos pelo usuário
     */
    setManualWeights(newWeights) {
        // Validar que soma é próxima de 1.0
        const sum = Object.values(newWeights).reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1.0) > 0.01) {
            throw new Error('Os pesos devem somar 1.0 (100%)');
        }
        
        this.weights = { ...newWeights };
        this.saveWeights();
        
        console.log('⚙️ Pesos ajustados manualmente:', this.weights);
        return this.weights;
    }
    
    /**
     * Obtém estatísticas de treinamento
     */
    getTrainingReport() {
        return {
            stats: this.trainingStats,
            currentWeights: this.weights,
            weightPercentages: {
                position: Math.round(this.weights.position * 100),
                sector: Math.round(this.weights.sector * 100),
                unit: Math.round(this.weights.unit * 100),
                skills: Math.round(this.weights.skills * 100),
                experience: Math.round(this.weights.experience * 100)
            },
            recentFeedback: this.feedbackHistory.slice(-10),
            recommendations: this.generateRecommendations()
        };
    }
    
    /**
     * Gera recomendações baseadas nos dados de treinamento
     */
    generateRecommendations() {
        const recs = [];
        
        if (this.trainingStats.totalFeedback < 5) {
            recs.push('💡 Forneça mais feedback para melhorar o algoritmo (mínimo: 5 avaliações)');
        }
        
        if (this.trainingStats.accuracy < 60) {
            recs.push('⚠️ Acurácia baixa. Considere ajustar manualmente os pesos do algoritmo.');
        } else if (this.trainingStats.accuracy > 80) {
            recs.push('✅ Ótima acurácia! O algoritmo está performando bem.');
        }
        
        if (this.weights.position > 0.40) {
            recs.push('📊 Cargo tem peso muito alto. Talvez skills deveriam ter mais importância?');
        }
        
        if (this.weights.skills < 0.10) {
            recs.push('🛠️ Skills estão com peso baixo. Considere aumentar se contratações têm exigido habilidades específicas.');
        }
        
        return recs;
    }
    
    // ==================== PERSISTÊNCIA ====================
    
    loadWeights() {
        const stored = localStorage.getItem('talentMatcher_weights');
        return stored ? JSON.parse(stored) : null;
    }
    
    saveWeights() {
        localStorage.setItem('talentMatcher_weights', JSON.stringify(this.weights));
    }
    
    loadFeedback() {
        const stored = localStorage.getItem('talentMatcher_feedback');
        return stored ? JSON.parse(stored) : null;
    }
    
    saveFeedback() {
        // Manter apenas últimos 100 feedbacks
        if (this.feedbackHistory.length > 100) {
            this.feedbackHistory = this.feedbackHistory.slice(-100);
        }
        localStorage.setItem('talentMatcher_feedback', JSON.stringify(this.feedbackHistory));
    }
    
    loadTrainingStats() {
        const stored = localStorage.getItem('talentMatcher_stats');
        return stored ? JSON.parse(stored) : null;
    }
    
    saveTrainingStats() {
        localStorage.setItem('talentMatcher_stats', JSON.stringify(this.trainingStats));
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    /**
     * Resetar algoritmo para valores padrão
     */
    resetToDefaults() {
        this.weights = {
            position: 0.35,
            sector: 0.25,
            unit: 0.20,
            skills: 0.15,
            experience: 0.05
        };
        this.saveWeights();
        console.log('🔄 Algoritmo resetado para valores padrão');
        return this.weights;
    }

    /**
     * Calcula score de compatibilidade entre um talento e uma vaga
     * @param {Object} talent - Talento do banco
     * @param {Object} job - Vaga aberta
     * @returns {Object} - Resultado do matching
     */
    calculateMatchScore(talent, job) {
        const scores = {
            position: this.matchPosition(talent, job),
            sector: this.matchSector(talent, job),
            unit: this.matchUnit(talent, job),
            skills: this.matchSkills(talent, job),
            experience: this.matchExperience(talent, job)
        };

        // Calcular score ponderado
        const weightedScore = (
            scores.position * this.weights.position +
            scores.sector * this.weights.sector +
            scores.unit * this.weights.unit +
            scores.skills * this.weights.skills +
            scores.experience * this.weights.experience
        );

        return {
            talentId: talent.id,
            talentName: talent.name,
            jobId: job.id,
            jobTitle: job.job_title,
            totalScore: Math.round(weightedScore * 100),
            scores: {
                position: Math.round(scores.position * 100),
                sector: Math.round(scores.sector * 100),
                unit: Math.round(scores.unit * 100),
                skills: Math.round(scores.skills * 100),
                experience: Math.round(scores.experience * 100)
            },
            isCompatible: weightedScore >= this.minScore,
            reasons: this.generateReasons(scores, talent, job)
        };
    }

    /**
     * Match de cargo/posição (35%)
     * Usa similaridade de strings e palavras-chave
     */
    matchPosition(talent, job) {
        const talentPosition = (talent.desired_position || talent.last_stage || '').toLowerCase();
        const jobTitle = (job.job_title || '').toLowerCase();
        const jobSector = (job.sector || '').toLowerCase();

        // Se não tem dados, retorna neutro
        if (!talentPosition && !jobTitle) return 0.5;

        // Match exato ou contém
        if (talentPosition === jobTitle) return 1.0;
        if (talentPosition.includes(jobTitle) || jobTitle.includes(talentPosition)) {
            return 0.9;
        }

        // Palavras-chave similares
        const keywords = this.extractKeywords(talentPosition + ' ' + jobTitle);
        const jobKeywords = this.extractKeywords(jobTitle + ' ' + jobSector);
        
        const commonWords = keywords.filter(k => jobKeywords.includes(k));
        const similarity = commonWords.length / Math.max(keywords.length, jobKeywords.length);

        return Math.max(0.3, similarity);
    }

    /**
     * Match de setor (25%)
     */
    matchSector(talent, job) {
        // Buscar setor do talento (pode estar em skills ou notes)
        const talentText = (talent.skills + ' ' + talent.experience + ' ' + talent.notes).toLowerCase();
        const jobSector = (job.sector || '').toLowerCase();

        if (!jobSector) return 0.5;
        
        // Verificar se menciona o setor em suas skills/experiência
        if (talentText.includes(jobSector)) return 0.9;
        
        // Verificar setores relacionados
        const relatedSectors = this.getRelatedSectors(jobSector);
        for (const related of relatedSectors) {
            if (talentText.includes(related)) return 0.7;
        }

        return 0.3;
    }

    /**
     * Match de unidade (20%)
     * Considera proximidade geográfica ou mesma unidade
     */
    matchUnit(talent, job) {
        const talentCity = (talent.city || '').toLowerCase();
        const jobUnit = (job.unit || '').toLowerCase();

        if (!jobUnit || !talentCity) return 0.5;

        // Match exato de unidade/cidade
        if (talentCity === jobUnit || 
            talentCity.includes(jobUnit) || 
            jobUnit.includes(talentCity)) {
            return 1.0;
        }

        // Unidades próximas (ex: FOR e EUS são próximas)
        const nearbyUnits = this.getNearbyUnits(jobUnit);
        if (nearbyUnits.some(u => talentCity.includes(u) || u.includes(talentCity))) {
            return 0.7;
        }

        // Mesmo estado
        const talentState = (talent.state || '').toLowerCase();
        const jobState = this.getStateFromUnit(jobUnit);
        if (talentState && jobState && talentState === jobState) {
            return 0.5;
        }

        return 0.2;
    }

    /**
     * Match de habilidades (15%)
     * Analisa palavras-chave de skills
     */
    matchSkills(talent, job) {
        const talentSkills = (talent.skills || '').toLowerCase().split(/[,;]/);
        const jobText = (job.job_title + ' ' + job.sector + ' ' + job.observation).toLowerCase();

        if (!talent.skills) return 0.5;

        let matchCount = 0;
        const relevantSkills = [];

        for (const skill of talentSkills) {
            const cleanSkill = skill.trim();
            if (cleanSkill.length < 2) continue;

            // Verificar se a skill é mencionada na vaga
            if (jobText.includes(cleanSkill)) {
                matchCount++;
                relevantSkills.push(cleanSkill);
            }
        }

        // Calcular proporção de skills relevantes
        const totalSkills = talentSkills.filter(s => s.trim().length >= 2).length;
        const score = totalSkills > 0 ? matchCount / Math.min(totalSkills, 5) : 0.5;

        return Math.min(1.0, Math.max(0.3, score));
    }

    /**
     * Match de experiência (5%)
     * Verifica anos de experiência mencionados
     */
    matchExperience(talent, job) {
        const talentExp = talent.experience || '';
        
        // Extrair anos de experiência
        const years = this.extractYears(talentExp);
        
        // Se tem experiência documentada, dá pontos
        if (years > 0) {
            return Math.min(1.0, 0.5 + (years * 0.1));
        }

        // Se não tem info, neutro
        return 0.5;
    }

    /**
     * Extrair palavras-chave de um texto
     */
    extractKeywords(text) {
        if (!text) return [];
        
        const stopWords = ['de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'para', 'com', 'por', 'a', 'o', 'e', 'ou', 'um', 'uma'];
        
        return text
            .toLowerCase()
            .replace(/[^À-ſa-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 3 && !stopWords.includes(w));
    }

    /**
     * Obter setores relacionados
     */
    getRelatedSectors(sector) {
        const relations = {
            'mecânica': ['mecanico', 'mecanica', 'manutenção', 'oficina'],
            'administrativo': ['admin', 'escritorio', 'financeiro', 'rh'],
            'operacional': ['operacao', 'campo', 'producao'],
            'vendas': ['comercial', 'venda', 'negocios'],
            'logística': ['logistica', 'transporte', 'distribuicao'],
            'ti': ['tecnologia', 'informatica', 'sistemas', 'dev']
        };

        return relations[sector] || [];
    }

    /**
     * Obter unidades próximas
     */
    getNearbyUnits(unit) {
        const nearby = {
            'for': ['eus', 'caucaia'],
            'eus': ['for', 'caucaia'],
            'slz': ['sao luis'],
            'ter': ['teresina'],
            'jua': ['juazeiro']
        };

        return nearby[unit.toLowerCase()] || [];
    }

    /**
     * Obter estado a partir da unidade
     */
    getStateFromUnit(unit) {
        const states = {
            'for': 'ce',
            'eus': 'ce',
            'slz': 'ma',
            'ter': 'pi',
            'jua': 'ce'
        };

        return states[unit.toLowerCase()] || '';
    }

    /**
     * Extrair anos de experiência de texto
     */
    extractYears(text) {
        if (!text) return 0;
        
        // Procura por padrões como "5 anos", "10+ anos", etc.
        const matches = text.match(/(\d+)\s*\+?\s*(?:anos?|years?)/i);
        return matches ? parseInt(matches[1]) : 0;
    }

    /**
     * Gerar razões para o match
     */
    generateReasons(scores, talent, job) {
        const reasons = [];

        if (scores.position >= 0.8) {
            reasons.push(`✅ Cargo compatível: ${talent.desired_position || talent.name}`);
        }
        if (scores.sector >= 0.7) {
            reasons.push(`✅ Experiência no setor ${job.sector || 'da vaga'}`);
        }
        if (scores.unit >= 0.7) {
            reasons.push(`✅ Localização próxima: ${talent.city || talent.state || 'Região compatível'}`);
        }
        if (scores.skills >= 0.6) {
            reasons.push(`✅ Skills alinhadas com a vaga`);
        }

        return reasons;
    }

    /**
     * Encontrar os melhores matches para uma vaga
     * @param {Array} talents - Lista de talentos do banco
     * @param {Object} job - Vaga a ser preenchida
     * @param {Number} limit - Limite de resultados
     * @returns {Array} - Lista de matches ordenados por score
     */
    findBestMatches(talents, job, limit = 5) {
        const matches = talents
            .filter(t => t.is_available !== 0) // Apenas disponíveis
            .map(t => this.calculateMatchScore(t, job))
            .filter(m => m.isCompatible) // Apenas compatíveis (>60%)
            .sort((a, b) => b.totalScore - a.totalScore) // Ordenar por score
            .slice(0, limit); // Pegar os top N

        return matches;
    }

    /**
     * Analisar uma vaga e retornar insights
     * @param {Object} job - Vaga
     * @returns {Object} - Insights sobre dificuldade de preenchimento
     */
    analyzeJobDifficulty(job, availableTalentCount) {
        const factors = {
            nicheSkills: this.isNicheJob(job),
            remoteFriendly: this.isRemoteFriendly(job),
            talentPool: availableTalentCount
        };

        let difficulty = 'normal';
        let suggestion = '';

        if (availableTalentCount === 0) {
            difficulty = 'hard';
            suggestion = '⚠️ Nenhum candidato no banco de talentos para esta vaga. Considere abrir processo seletivo externo.';
        } else if (availableTalentCount < 3) {
            difficulty = 'medium';
            suggestion = `ℹ️ Apenas ${availableTalentCount} candidato(s) compatível(eis) no banco. Recomendado busca ativa.`;
        } else if (availableTalentCount >= 5) {
            difficulty = 'easy';
            suggestion = `🎯 ${availableTalentCount} candidatos compatíveis! Ótima chance de preenchimento rápido.`;
        }

        return {
            difficulty,
            suggestion,
            factors,
            recommendedAction: this.getRecommendedAction(difficulty, job)
        };
    }

    /**
     * Verifica se é uma vaga de nicho (difícil)
     */
    isNicheJob(job) {
        const nicheTerms = ['especialista', 'coordenador', 'gerente', 'diretor', 'engenheiro', 'supervisor'];
        const title = (job.job_title || '').toLowerCase();
        return nicheTerms.some(term => title.includes(term));
    }

    /**
     * Verifica se a vaga aceita remoto
     */
    isRemoteFriendly(job) {
        const remoteTerms = ['remoto', 'home office', 'hibrido', 'flexivel'];
        const text = (job.job_title + ' ' + job.observation).toLowerCase();
        return remoteTerms.some(term => text.includes(term));
    }

    /**
     * Recomendação de ação baseada na dificuldade
     */
    getRecommendedAction(difficulty, job) {
        const actions = {
            easy: [
                'Entrar em contato imediato com os top 3 candidatos',
                'Agendar entrevistas para esta semana',
                'Preparar proposta competitiva'
            ],
            medium: [
                'Entrar em contato com todos os candidatos compatíveis',
                'Considerar publicação em job boards externos',
                'Verificar referências internas'
            ],
            hard: [
                'Abrir processo seletivo externo imediatamente',
                'Considerar headhunter para a posição',
                'Avaliar possibilidade de transferência interna',
                'Revisar requisitos da vaga (são realistas?)'
            ]
        };

        return actions[difficulty] || actions.medium;
    }
}

// Exportar para uso global
window.TalentMatcher = TalentMatcher;

// Instância singleton para uso fácil
window.talentMatcher = new TalentMatcher();

console.log('🧠 Talent Matcher carregado e pronto para uso!');

/**
 * Uso básico:
 * 
 * // Calcular match entre um talento e uma vaga
 * const match = talentMatcher.calculateMatchScore(talento, vaga);
 * console.log(match.totalScore); // 0-100
 * 
 * // Encontrar melhores candidatos para uma vaga
 * const matches = talentMatcher.findBestMatches(talentos, vaga, 5);
 * 
 * // Analisar dificuldade de preenchimento
 * const analysis = talentMatcher.analyzeJobDifficulty(vaga, numCandidatos);
 */
