[CmdletBinding()]
param(
    [string]$CurrentPage = 'https://ukiahcomputerworks.github.io/alpha-labs-48hr-preview/'
)

Add-Type -AssemblyName System.Web
$builder = [UriBuilder]$CurrentPage
$query = [System.Web.HttpUtility]::ParseQueryString($builder.Query)
$query['demo-action'] = 'reset'
$builder.Query = $query.ToString()

[pscustomobject]@{
    Status = 'READY_FOR_INSTANT_BROWSER_NAVIGATION'
    Action = 'reset'
    Url = $builder.Uri.AbsoluteUri
}
