// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "identify guilds"  // ESSENCIAL: 'guilds' permite acessar /users/@me/guilds
                }
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, account, profile }) {
            console.log("[JWT Callback] Account presente:", !!account);
            
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
                console.log("[JWT] AccessToken salvo no token");
            }
            if (profile) {
                token.id = profile.id;
            }
            return token;
        },
        async session({ session, token }) {
            console.log("[Session Callback] Token tem accessToken:", !!token.accessToken);
            
            // Adiciona o accessToken à sessão
            session.accessToken = token.accessToken;
            session.user.id = token.id;
            
            console.log("[Session] AccessToken adicionado à sessão");
            return session;
        }
    },
    debug: true, // Ativa logs de debug para ajudar a identificar problemas
};

export default NextAuth(authOptions);