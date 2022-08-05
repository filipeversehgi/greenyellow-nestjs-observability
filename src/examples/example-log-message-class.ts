import { AbstractLogMessage, BaseLogFields } from "src/logger";

type TLogMessage = BaseLogFields & {
    userMail: string,
    userAge: number,

}

class LogMessage extends AbstractLogMessage<TLogMessage> {
    constructor(message: string) {
        super(message)
    }

    /**
     * The System User Email
     * @param email 
     */
    userMail(email: string) {
        return this.set('userMail', email);
    }

    /**
     * The System user Age, in numbers
     * @param age
     */
    userAge(age: number) {
        return this.set('userAge', age)
    }
}