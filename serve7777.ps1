$port = 7777
$folder = "c:\Drive\Unity\Projects\PersonalProjects\Portfolio-Website"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "READY on http://localhost:$port" -ForegroundColor Green

while ($listener.IsListening) {
    try {
        $ctx = $listener.GetContext()
        $path = $ctx.Request.Url.LocalPath.TrimStart('/')
        if ($path -eq '') { $path = 'index.html' }
        $file = Join-Path $folder $path
        if (Test-Path $file -PathType Leaf) {
            $ext = [IO.Path]::GetExtension($file).ToLower()
            $mime = switch ($ext) {
                '.html' { 'text/html; charset=utf-8' }
                '.css'  { 'text/css' }
                '.js'   { 'application/javascript; charset=utf-8' }
                default { 'application/octet-stream' }
            }
            $data = [IO.File]::ReadAllBytes($file)
            $ctx.Response.ContentType = $mime
            $ctx.Response.ContentLength64 = $data.Length
            $ctx.Response.AddHeader('Cache-Control', 'no-cache, no-store')
            $ctx.Response.OutputStream.Write($data, 0, $data.Length)
        } else {
            $ctx.Response.StatusCode = 404
            $body = [System.Text.Encoding]::UTF8.GetBytes('404')
            $ctx.Response.OutputStream.Write($body, 0, $body.Length)
        }
        $ctx.Response.OutputStream.Close()
    } catch { }
}
