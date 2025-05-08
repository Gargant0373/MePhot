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

const getAuthHeader = (password: string): string => {
  return `Basic ${btoa(`user:${password}`)}`;
};

export const bypassNgrokWarning = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
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
    if (config.serverUrl.includes('ngrok')) {
      await bypassNgrokWarning(config.serverUrl);
    }

    const response = await fetch(`${config.serverUrl}/api/folders`, {
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
    const url = new URL(`${config.serverUrl}/api/folders/${folderName}`);
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
  const authToken = btoa(`user:${config.password}`);
  return `${config.serverUrl}/api/images/${folderName}/${imageName}?auth=${encodeURIComponent(authToken)}`;
};

export const testConnection = async (config: ApiConfig): Promise<boolean> => {
  try {
    if (config.serverUrl.includes('ngrok')) {
      await bypassNgrokWarning(config.serverUrl);
    }
    
    const response = await fetch(`${config.serverUrl}/api/folders`, {
      headers: {
        'Authorization': getAuthHeader(config.password)
      },
      credentials: 'include'
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error testing connection:', error);
    return false;
  }
};