import { OPENID_CLIENT_ID, OPENID_PROVIDER_URL, AUTH0_TOKEN_CLIENT_ID, AUTH0_TOKEN_CLIENT_SECRET } from "$env/static/private";
import axios from "axios";
// import { resolveBaseUrl } from "vite";

const AUTH0_API_AUDIENCE = OPENID_PROVIDER_URL + "/api/v2/";
const USER_CREATE_ENDPOINT = AUTH0_API_AUDIENCE + "users";
const TOKEN_URL = OPENID_PROVIDER_URL + "/oauth/token";

// const  url = 'https://dev-qksm2c8wpal56mxz.us.auth0.com/oauth/token';
// const   client_id = "8QCzVyJQuJi4tFN6H4KszrCgoFGB7YaT";
// const client_secret = "wieWFaDbrfoDOBGNMI86ndZ4bP5OB0p-EFz9WGawc_gz2apa1mMm5GAV0dTwzh_s";
// const audience = "https://dev-qksm2c8wpal56mxz.us.auth0.com/api/v2/";
const grant_type = "client_credentials";


export async function register(user) {
    try {
        const accessTokenResponse = await getAccessToken();
        
        if (accessTokenResponse && accessTokenResponse.data && 'statusCode' in accessTokenResponse.data && accessTokenResponse.data.statusCode != 200) {
            return accessTokenResponse.data;
        } else if ('access_token' in accessTokenResponse.data) {
            const registeredUser = await createUser(accessTokenResponse.data.access_token, user);
            if (registeredUser && registeredUser.data && 'statusCode' in registeredUser.data && registeredUser.data.statusCode != 200) {
                console.log("Reg user return none 200 status code")
                return registeredUser.data;
            } else if (registeredUser && registeredUser.data) {
                console.log("Status code is  200, returning the data as is.");
               // console.log("================================================:: " + JSON.stringify(registeredUser.data));
                return registeredUser.data;
            } else {
                throw new Error("Unable to create the registration.");
            }
        } else {
            return { 'statusCode': 520, 'error': 'Unknown error', 'message': 'Unknown error occurred.' };
        }
    } catch (e) {
        console.log("Exception: " + e);
        return e;
    }
    return { 'statusCode': 520, 'error': 'Unknown error', 'message': 'Unknown error occurred.' };

}

export async function update(user, userId) {
    const accessTokenResponse = await getAccessToken();
    if (accessTokenResponse && accessTokenResponse.data && 'statusCode' in accessTokenResponse.data && accessTokenResponse.data.statusCode != 200) {
        return accessTokenResponse.data;
    } else {
        const updatedUser = await updateUser(accessTokenResponse.data.access_token, user, userId);
        if (updatedUser && updatedUser.data && 'statusCode' in updatedUser.data && updatedUser.data.statusCode != 200) {
            return updatedUser.data;
        } else if (updatedUser && updatedUser.data) {
            console.log("Status code is  200, returning the data as is.");
            return updatedUser.data;
        } else {
            throw new Error("Unable to create the registration.");
        }
    }
    return {};
}

export async function password(email) {

    const url = OPENID_PROVIDER_URL + "/dbconnections/change_password";
    const data = {'client_id': OPENID_CLIENT_ID,'email': email, 'connection': 'Username-Password-Authentication' }
    const response = await axios.post(url, data, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return {status: response.status, message: response.data};
}

async function getAccessToken() {
    const token_data = {
        "grant_type": grant_type,
        "client_id": AUTH0_TOKEN_CLIENT_ID,
        "client_secret": AUTH0_TOKEN_CLIENT_SECRET,
        "audience": AUTH0_API_AUDIENCE
    }

    const response = await axios.post(TOKEN_URL, token_data, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return response;
}

async function createUser(token, user) {
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    }

    const response = await axios.post(USER_CREATE_ENDPOINT, user, {
        headers: headers,
    });

    return response;
}

async function updateUser(token, user, userId) {
    //{"name":"ansarisam501@gmail.com","email":"ansarisam501@gmail.com","username":null,"password":"","role":"admin","status":"active","group":"inactive"}
    let url = OPENID_PROVIDER_URL+"/api/v2/users/"+userId;
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    }

    const response = await axios.patch(url, user, {
        headers: headers,
    });
    

    console.log("Create user function data: " + response.data);
    return response;
}
