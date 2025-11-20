import pandas as pd

def adjust_column_name(df):
    columns_name = df.columns.tolist()
    new_columns_name = [col.strip().lower().replace(' ', '_') for col in columns_name]
    df.columns = new_columns_name
    df.columns = df.columns.str.replace('<.*?>', '', regex=True)
    df.columns = df.columns.str.replace('.', '', regex=False)
    new_columns_name = {df.columns[0]:'ref', df.columns[1]:'nome'}
    df.rename(columns=new_columns_name, inplace=True)
    return df

def create_mp_data(df, column_name):
    df[column_name] = df[column_name].str.replace(r'\s+', '', regex=True)
    df[['mp1', 'mp2', 'mp3']]  = df[column_name].str.extract(r'(\d+)x(\d+)x(\d+[,\.]\d+)')

    # Substituir vírgula por ponto se necessário
    df['mp3'] = df['mp3'].str.replace(',', '.')
    df['peso_mp'] = round((df['mp1'].astype(float) * df['mp2'].astype(float) * df['mp3'].astype(float) * 7.85 / 1000000)*df['qtd'],2)
    df['mp3'] = df['mp3'].astype(float)
    return df

def extract_data(path):
    df = pd.read_csv(path, sep=';', encoding='latin1')
    df = adjust_column_name(df)
    df = create_mp_data(df, 'mp')
    df.dropna(subset=['nome'], inplace=True)

    return df
