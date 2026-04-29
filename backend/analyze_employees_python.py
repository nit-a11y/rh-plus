#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Análise Detalhada do Arquivo employees.xlsx
Sistema RH+ - Nordeste Locações
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Configurações para visualização
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 10

# Configuração para exibir gráficos em português
plt.rcParams['axes.titlesize'] = 14
plt.rcParams['axes.labelsize'] = 12
plt.rcParams['xtick.labelsize'] = 10
plt.rcParams['ytick.labelsize'] = 10

def carregar_dados():
    """Carrega e prepara os dados do arquivo Excel"""
    print("=== CARREGANDO DADOS ===")
    
    # Carregar arquivo Excel
    df = pd.read_excel('employees.xlsx')
    
    print(f"Dataset carregado: {df.shape[0]} linhas × {df.shape[1]} colunas")
    print(f"Memória utilizada: {df.memory_usage(deep=True).sum() / 1024:.2f} KB")
    
    return df

def analise_estrutura(df):
    """Análise da estrutura e qualidade dos dados"""
    print("\n" + "="*50)
    print("ANÁLISE DA ESTRUTURA DOS DADOS")
    print("="*50)
    
    # Informações básicas
    print(f"\nDimensões: {df.shape[0]} registros × {df.shape[1]} variáveis")
    
    # Tipos de dados
    print("\nTipos de dados:")
    print(df.dtypes.value_counts())
    
    # Valores nulos
    print("\nValores nulos por coluna:")
    nulos = df.isnull().sum()
    nulos_percent = (nulos / len(df) * 100).round(2)
    
    for col in df.columns:
        nulos_count = nulos[col]
        nulos_pct = nulos_percent[col]
        if nulos_count > 0:
            print(f"  {col}: {nulos_count} ({nulos_pct}%)")
    
    # Estatísticas descritivas básicas
    print("\nEstatísticas descritivas das variáveis numéricas:")
    print(df.describe().round(2))
    
    return nulos, nulos_percent

def analise_demografica(df):
    """Análise demográfica dos colaboradores"""
    print("\n" + "="*50)
    print("ANÁLISE DEMOGRÁFICA")
    print("="*50)
    
    # Análise por gênero
    if 'gender' in df.columns:
        print("\nDistribuição por Gênero:")
        gender_dist = df['gender'].value_counts()
        for gender, count in gender_dist.items():
            pct = round(count / len(df) * 100, 1)
            print(f"  {gender}: {count} ({pct}%)")
    
    # Análise por estado civil
    if 'maritalStatus' in df.columns:
        print("\nDistribuição por Estado Civil:")
        marital_dist = df['maritalStatus'].value_counts()
        for status, count in marital_dist.items():
            pct = round(count / len(df) * 100, 1)
            print(f"  {status}: {count} ({pct}%)")
    
    # Análise por escolaridade
    if 'educationLevel' in df.columns:
        print("\nDistribuição por Escolaridade:")
        education_dist = df['educationLevel'].value_counts()
        for level, count in education_dist.items():
            pct = round(count / len(df) * 100, 1)
            print(f"  {level}: {count} ({pct}%)")
    
    # Análise etária
    if 'birthDate' in df.columns:
        # Converter para datetime se necessário
        df['birthDate'] = pd.to_datetime(df['birthDate'], errors='coerce')
        hoje = datetime.now()
        df['idade'] = df['birthDate'].apply(lambda x: hoje.year - x.year if pd.notnull(x) else np.nan)
        
        print("\nAnálise de Idade:")
        idades_validas = df['idade'].dropna()
        if len(idades_validas) > 0:
            print(f"  Idade média: {idades_validas.mean():.1f} anos")
        print(f"  Idade mínima: {idades_validas.min():.0f} anos")
        print(f"  Idade máxima: {idades_validas.max():.0f} anos")
        print(f"  Desvio padrão: {idades_validas.std():.1f} anos")

def analise_profissional(df):
    """Análise profissional dos colaboradores"""
    print("\n" + "="*50)
    print("ANÁLISE PROFISSIONAL")
    print("="*50)
    
    # Análise por tipo de colaborador
    if 'type' in df.columns:
        print("\nDistribuição por Tipo de Colaborador:")
        type_dist = df['type'].value_counts()
        for tipo, count in type_dist.items():
            pct = round(count / len(df) * 100, 1)
            print(f"  {tipo}: {count} ({pct}%)")
    
    # Análise por setor
    if 'sector' in df.columns:
        print("\nDistribuição por Setor:")
        sector_dist = df['sector'].value_counts()
        for sector, count in sector_dist.items():
            pct = round(count / len(df) * 100, 1)
            print(f"  {sector}: {count} ({pct}%)")
    
    # Análise por cargo
    if 'role' in df.columns:
        print("\nTop 10 Cargos mais frequentes:")
        role_dist = df['role'].value_counts().head(10)
        for role, count in role_dist.items():
            pct = round(count / len(df) * 100, 1)
            print(f"  {role}: {count} ({pct}%)")
    
    # Análise salarial
    if 'currentSalary' in df.columns:
        print("\nAnálise Salarial:")
        salarios_validos = df['currentSalary'].dropna()
        if len(salarios_validos) > 0:
            print(f"  Salário médio: R$ {salarios_validos.mean():,.2f}")
            print(f"  Salário mínimo: R$ {salarios_validos.min():,.2f}")
            print(f"  Salário máximo: R$ {salarios_validos.max():,.2f}")
            print(f"  Mediana: R$ {salarios_validos.median():,.2f}")
            print(f"  Desvio padrão: R$ {salarios_validos.std():,.2f}")
            
            # Faixas salariais
            print("\nFaixas Salariais:")
            faixas = [
                ('Até R$ 1.500', salarios_validos <= 1500),
                ('R$ 1.501 - R$ 3.000', (salarios_validos > 1500) & (salarios_validos <= 3000)),
                ('R$ 3.001 - R$ 5.000', (salarios_validos > 3000) & (salarios_validos <= 5000)),
                ('R$ 5.001 - R$ 8.000', (salarios_validos > 5000) & (salarios_validos <= 8000)),
                ('Acima de R$ 8.000', salarios_validos > 8000)
            ]
            
            for faixa, condicao in faixas:
                count = condicao.sum()
                pct = round(count / len(salarios_validos) * 100, 1)
                print(f"  {faixa}: {count} ({pct}%)")

def analise_tempo_servico(df):
    """Análise de tempo de serviço"""
    print("\n" + "="*50)
    print("ANÁLISE DE TEMPO DE SERVIÇO")
    print("="*50)
    
    if 'admissionDate' in df.columns:
        # Converter para datetime
        df['admissionDate'] = pd.to_datetime(df['admissionDate'], errors='coerce')
        hoje = datetime.now()
        
        # Calcular tempo de serviço em anos
        df['tempo_servico'] = df['admissionDate'].apply(
            lambda x: (hoje - x).days / 365.25 if pd.notnull(x) else np.nan
        )
        
        tempos_validos = df['tempo_servico'].dropna()
        
        if len(tempos_validos) > 0:
            print(f"Tempo médio de serviço: {tempos_validos.mean():.1f} anos")
            print(f"Tempo mínimo de serviço: {tempos_validos.min():.1f} anos")
            print(f"Tempo máximo de serviço: {tempos_validos.max():.1f} anos")
            
            # Distribuição por faixas de tempo
            print("\nDistribuição por Tempo de Serviço:")
            faixas_tempo = [
                ('Até 1 ano', tempos_validos <= 1),
                ('1-3 anos', (tempos_validos > 1) & (tempos_validos <= 3)),
                ('3-5 anos', (tempos_validos > 3) & (tempos_validos <= 5)),
                ('5-10 anos', (tempos_validos > 5) & (tempos_validos <= 10)),
                ('Mais de 10 anos', tempos_validos > 10)
            ]
            
            for faixa, condicao in faixas_tempo:
                count = condicao.sum()
                pct = round(count / len(tempos_validos) * 100, 1)
                print(f"  {faixa}: {count} ({pct}%)")

def criar_visualizacoes(df):
    """Cria visualizações dos dados"""
    print("\n" + "="*50)
    print("CRIANDO VISUALIZAÇÕES")
    print("="*50)
    
    # Criar diretório para salvar gráficos
    import os
    if not os.path.exists('analise_visual'):
        os.makedirs('analise_visual')
    
    # 1. Distribuição por Tipo de Colaborador
    if 'type' in df.columns:
        plt.figure(figsize=(10, 6))
        df['type'].value_counts().plot(kind='bar')
        plt.title('Distribuição por Tipo de Colaborador')
        plt.xlabel('Tipo')
        plt.ylabel('Quantidade')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig('analise_visual/tipo_colaborador.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("Gráfico salvo: analise_visual/tipo_colaborador.png")
    
    # 2. Distribuição Salarial
    if 'currentSalary' in df.columns:
        plt.figure(figsize=(12, 6))
        
        plt.subplot(1, 2, 1)
        salarios_validos = df['currentSalary'].dropna()
        plt.hist(salarios_validos, bins=20, alpha=0.7, edgecolor='black')
        plt.title('Distribuição Salarial')
        plt.xlabel('Salário (R$)')
        plt.ylabel('Frequência')
        
        plt.subplot(1, 2, 2)
        plt.boxplot(salarios_validos)
        plt.title('Boxplot Salarial')
        plt.ylabel('Salário (R$)')
        
        plt.tight_layout()
        plt.savefig('analise_visual/distribuicao_salarial.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("Gráfico salvo: analise_visual/distribuicao_salarial.png")
    
    # 3. Top 10 Setores
    if 'sector' in df.columns:
        plt.figure(figsize=(12, 8))
        top_sectors = df['sector'].value_counts().head(10)
        top_sectors.plot(kind='barh')
        plt.title('Top 10 Setores - Quantidade de Colaboradores')
        plt.xlabel('Quantidade')
        plt.ylabel('Setor')
        plt.tight_layout()
        plt.savefig('analise_visual/top_setores.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("Gráfico salvo: analise_visual/top_setores.png")
    
    # 4. Distribuição por Gênero
    if 'gender' in df.columns:
        plt.figure(figsize=(8, 8))
        gender_counts = df['gender'].value_counts()
        plt.pie(gender_counts.values, labels=gender_counts.index, autopct='%1.1f%%')
        plt.title('Distribuição por Gênero')
        plt.savefig('analise_visual/distribuicao_genero.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("Gráfico salvo: analise_visual/distribuicao_genero.png")

def gerar_relatorio_final(df):
    """Gera um relatório final com insights"""
    print("\n" + "="*50)
    print("RELATÓRIO FINAL - INSIGHTS")
    print("="*50)
    
    print("\n=== RESUMO EXECUTIVO ===")
    print(f"Total de colaboradores analisados: {len(df)}")
    print(f"Data da análise: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    
    print("\n=== PRINCIPAIS INSIGHTS ===")
    
    # Insight 1: Composição da força de trabalho
    if 'type' in df.columns:
        tipo_mais_comum = df['type'].value_counts().index[0]
        pct_tipo = round(df['type'].value_counts().iloc[0] / len(df) * 100, 1)
        print(f"1. A maioria dos colaboradores são '{tipo_mais_comum}' ({pct_tipo}% do total)")
    
    # Insight 2: Análise salarial
    if 'currentSalary' in df.columns:
        salarios_validos = df['currentSalary'].dropna()
        media_salarial = salarios_validos.mean()
        mediana_salarial = salarios_validos.median()
        
        if media_salarial > mediana_salarial * 1.2:
            print("2. Há uma concentração de salários mais baixos com alguns outliers elevados")
        elif media_salarial < mediana_salarial * 0.8:
            print("2. A distribuição salarial é assimétrica à esquerda, com salários mais concentrados no topo")
        else:
            print("2. A distribuição salarial é relativamente equilibrada")
    
    # Insight 3: Dados demográficos
    if 'gender' in df.columns:
        genero_mais_comum = df['gender'].value_counts().index[0]
        pct_genero = round(df['gender'].value_counts().iloc[0] / len(df) * 100, 1)
        print(f"3. Predominância do gênero '{genero_mais_comum}' com {pct_genero}% dos colaboradores")
    
    # Insight 4: Qualidade dos dados
    nulos_pct = (df.isnull().sum() / len(df) * 100).mean()
    if nulos_pct < 10:
        print("4. Excelente qualidade dos dados com baixa taxa de valores nulos")
    elif nulos_pct < 25:
        print("4. Boa qualidade dos dados com taxa moderada de valores nulos")
    else:
        print("4. Atenção necessária: alta taxa de valores nulos nos dados")
    
    # Insight 5: Setores
    if 'sector' in df.columns:
        setor_maior = df['sector'].value_counts().index[0]
        count_setor = df['sector'].value_counts().iloc[0]
        print(f"5. O setor '{setor_maior}' concentra o maior número de colaboradores ({count_setor} pessoas)")
    
    print("\n=== RECOMENDAÇÕES ===")
    print("1. Completar dados demográficos para melhor análise de diversidade")
    print("2. Revisar campos com alta taxa de nulos (contato, endereço)")
    print("3. Monitorar distribuição salarial para equidade interna")
    print("4. Analisar correlação entre tempo de serviço e salário")
    print("5. Desenvolver estratégias de retenção baseadas nos dados demográficos")

def main():
    """Função principal de execução"""
    print("="*60)
    print("ANÁLISE DETALHADA - EMPLOYEES.XLSX")
    print("Sistema RH+ - Nordeste Locações")
    print("="*60)
    
    try:
        # Carregar dados
        df = carregar_dados()
        
        # Análises
        analise_estrutura(df)
        analise_demografica(df)
        analise_profissional(df)
        analise_tempo_servico(df)
        
        # Visualizações
        criar_visualizacoes(df)
        
        # Relatório final
        gerar_relatorio_final(df)
        
        print("\n" + "="*60)
        print("ANÁLISE CONCLUÍDA COM SUCESSO!")
        print("Verifique a pasta 'analise_visual' para os gráficos gerados.")
        print("="*60)
        
    except Exception as e:
        print(f"\nERRO NA ANÁLISE: {str(e)}")
        print("Verifique se o arquivo employees.xlsx está no mesmo diretório.")

if __name__ == "__main__":
    main()
