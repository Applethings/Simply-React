import { VoteUser } from './VoteUser';
import { getCollection } from '../mongo';
import { addEvent } from '../functions';

module.exports = async (data: VoteUser) => {
    getCollection("votes").updateOne({id: data.user_id}, {"$push": {votes: {at: Date.now(), source: data.source}}}, {upsert: true});
    addEvent({
        type: "vote",
        command: "vote",
        source: data.source
    });
}