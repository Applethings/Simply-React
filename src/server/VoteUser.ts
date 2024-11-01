export interface VoteUser1 {
    user: string
    type: 'upvote' | 'test'
    query: string
    isWeekend: boolean
    bot: string
}

export interface VoteUser2 {
    admin: boolean
    avatar: string
    username: string
    id: string
}

export interface VoteUser {
    user_id: string
    type: 'vote' | 'test'
    source: 'topgg' | 'discordbotlist'
}