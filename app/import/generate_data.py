import random
from datetime import datetime, date, timedelta
import pandas as pd
from extract_data import extract_data

def generate_operation(thickness,fabricacao):
    operation_list = ['CORTE','DOBRA','SOLDA','TERCEIRO']
    work_center_list = ['CORTE_G','CORTE_LASER','CORTE_PLASMA',
                        'DOBRA_1T','DOBRA_2T','SOLDA_MIG','SOLDA_TIG']
    operation_final = []
    if thickness > 6.35:
        operation_final.append('TERCEIRO')
        work_center = 'TERCEIRO'
    else:
        operation_final.append('CORTE')
    
        if fabricacao == 'EXTERNO':
            operation_final.append('TERCEIRO')
            work_center = 'TERCEIRO'
        else:
            operation_final.append('DOBRA')
    route_list = []
    for counter, op in enumerate(operation_final):
        dict_route = {}
        seq = (counter + 1)*5
        dict_route['seq'] = seq
        operation = op
        dict_route['operacao'] = operation
        route_list.append(dict_route)
    return route_list

def generate_raw_material(linha):
    raw_naterial_list = []
    codigo = random.randint(1000, 9999)
    descricao = linha['material']
    peso = linha['peso_mp']
    dict_raw = {
        'codigo': codigo,
        'descricao': descricao,
        'peso': peso
    }
    raw_naterial_list.append(dict_raw)
    return raw_naterial_list

def generate_data_json(df):
    ordens_json = []
    for indice, linha in df.iterrows():
        ordem_json = {}
        ordem_json['ordem_id'] = random.randint(1000, 9999)
        ordem_json['ref'] = linha['ref']
        ordem_json['empresa'] = 'CARROPEL CARROCERIAS'
        ordem_json['data_emissao'] = datetime.today().strftime('%d/%m/%Y')
        ordem_json['item'] = linha['nome']
        ordem_json['necessidade'] = (date.today() + timedelta(days=3)).strftime('%d/%m/%Y')
        ordem_json['quantidade'] = linha['qtd']
        ordem_json['peso_liquido'] = linha['peso_mp']
        ordem_json['descricao'] = ''
        ordem_json['roteiro'] = generate_operation(linha['mp3'], linha['fabricacao'])
        ordem_json['insumos'] = generate_raw_material(linha)
        ordens_json.append(ordem_json)   
    return ordens_json
