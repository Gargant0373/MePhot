export interface ApiConfig {
  serverUrl: string;
  password: string;
}

export interface PaginatedResponse {
  folderName: string;
  images: string[];
  pagination: {
    page: number;
    pageSize: number;
    totalImages: number;
    totalPages: number;
  }
}

const normalizeUrl = (url: string): string => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const getAuthHeader = (password: string): string => {
  return `Basic ${btoa(`user:${password}`)}`;
};

export const bypassNgrokWarning = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(normalizeUrl(url), { 
      credentials: 'include',
      mode: 'cors',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    console.error('Error bypassing ngrok warning:', error);
    return false;
  }
};

export const fetchFolders = async (config: ApiConfig): Promise<string[]> => {
  try {
    const baseUrl = normalizeUrl(config.serverUrl);
    
    if (baseUrl.includes('ngrok')) {
      await bypassNgrokWarning(baseUrl);
    }

    const response = await fetch(`${baseUrl}/api/folders`, {
      headers: {
        'Authorization': getAuthHeader(config.password)
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.folders;
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
};

export const fetchImages = async (
  config: ApiConfig,
  folderName: string,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse> => {
  try {
    const baseUrl = normalizeUrl(config.serverUrl);
    const url = new URL(`${baseUrl}/api/folders/${folderName}`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('pageSize', pageSize.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': getAuthHeader(config.password)
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching images from folder ${folderName}:`, error);
    throw error;
  }
};

export const getImageUrl = (
  config: ApiConfig,
  folderName: string,
  imageName: string
): string => {
  const baseUrl = normalizeUrl(config.serverUrl);
  const authToken = btoa(`user:${config.password}`);
  return `${baseUrl}/api/images/${folderName}/${imageName}?auth=${encodeURIComponent(authToken)}`;
};

export const testConnection = async (config: ApiConfig): Promise<boolean> => {
  try {
    const baseUrl = normalizeUrl(config.serverUrl);
    
    if (baseUrl.includes('ngrok') || baseUrl.includes('loca.lt')) {
      await bypassNgrokWarning(baseUrl);
    }
    
    console.log(`Testing connection to: ${baseUrl}/api/folders`);
    
    const response = await fetch(`${baseUrl}/api/folders`, {
      headers: {
        'Authorization': getAuthHeader(config.password)
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error(`Server responded with status: ${response.status}`);
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error testing connection:', error);
    return false;
  }
};