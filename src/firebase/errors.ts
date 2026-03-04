export type SecurityRuleContext = {
  path: string
  operation: "get" | "list" | "create" | "update" | "delete"
  requestResourceData?: any
}

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext

  constructor(context: SecurityRuleContext) {
    const defaultMessage = `Firestore operation '${context.operation}' on path '${context.path}' was denied by security rules.`
    super(defaultMessage)
    this.name = "FirestorePermissionError"
    this.context = context
  }

  public toContextObject() {
    return {
      message: this.message,
      context: this.context,
    }
  }
}
